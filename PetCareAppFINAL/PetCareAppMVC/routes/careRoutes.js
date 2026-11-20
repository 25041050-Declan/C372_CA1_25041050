const router = require('express').Router();
const db = require('../config/db').promise();
const {isLoggedIn} = require('../middleware/auth');
const {today, shift, due} = require('../helpers/careDates');
router.use('/care', isLoggedIn);
router.get('/care', async (req,res) => {
  const owner = req.session.user.id;
  const day = today();
  const days = Array.from({length:7}, (_,i)=>shift(day,i-6));
  const [pets] = await db.execute('SELECT id,name FROM pets WHERE owner_id=? ORDER BY name,id',[owner]);
  const [routines] = await db.execute(`SELECT r.id,r.pet_id,p.name,r.title,LEFT(r.at_time,5) AS clock,r.weekday,
    DATE_FORMAT(r.starts,'%Y-%m-%d') AS starts, DATE_FORMAT(r.ends,'%Y-%m-%d') AS ends
    FROM care_routines r JOIN pets p ON p.id=r.pet_id WHERE p.owner_id=? AND (r.ends IS NULL OR r.ends>=?)
    ORDER BY r.at_time,p.name,r.id`,[owner,days[0]]);
  const [logs] = await db.execute(`SELECT c.routine_id, DATE_FORMAT(c.care_date,'%Y-%m-%d') AS day
    FROM care_completions c JOIN care_routines r ON r.id=c.routine_id JOIN pets p ON p.id=r.pet_id
    WHERE p.owner_id=? AND c.care_date BETWEEN ? AND ?`,[owner,days[0],day]);
  const selected = pets.find(p=>String(p.id)===req.query.pet) || pets[0];
  res.render('care',{session:req.session,pets,selected,day,days,routines,due,done:new Set(logs.map(l=>l.routine_id+'/'+l.day))});
});
router.post('/care/routines', async (req,res)=>{
  const {pet,title,clock,weekday} = req.body;
  if (!/^\d+$/.test(pet) || typeof title!=='string' || !title.trim() || title.trim().length>100 ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(clock) || !/^(daily|[0-6])$/.test(weekday)) return res.status(400).send('Invalid routine.');
  const [result] = await db.execute(`INSERT INTO care_routines(pet_id,title,at_time,weekday,starts)
    SELECT id,?,?,?,? FROM pets WHERE id=? AND owner_id=?`,[title.trim(),clock,weekday==='daily'?null:Number(weekday),today(),pet,req.session.user.id]);
  if (!result.affectedRows) return res.sendStatus(404);
  res.redirect('/care?pet='+pet);
});
router.post('/care/:id/check', async (req,res)=>{
  const day=today();
  if (req.body.day!==day) return res.status(409).send('The date changed. Reopen the planner.');
  const eligible = ` FROM care_routines r JOIN pets p ON p.id=r.pet_id WHERE r.id=? AND p.owner_id=?
    AND r.starts<=? AND (r.ends IS NULL OR r.ends>=?) AND (r.weekday IS NULL OR r.weekday=DAYOFWEEK(?)-1)`;
  const args=[req.params.id,req.session.user.id,day,day,day];
  if(req.body.action==='done') await db.execute('INSERT INTO care_completions SELECT r.id,?'+eligible+' ON DUPLICATE KEY UPDATE care_date=VALUES(care_date)',[day,...args]);
  else if(req.body.action==='undo') await db.execute('DELETE FROM care_completions WHERE care_date=? AND routine_id IN (SELECT r.id'+eligible+')',[day,...args]);
  else return res.sendStatus(400);
  res.redirect('/care');
});
router.post('/care/:id/stop', async (req,res)=>{
  await db.execute('UPDATE care_routines r JOIN pets p ON p.id=r.pet_id SET r.ends=? WHERE r.id=? AND p.owner_id=? AND r.ends IS NULL',[today(),req.params.id,req.session.user.id]);
  res.redirect('/care');
});
module.exports=router;
