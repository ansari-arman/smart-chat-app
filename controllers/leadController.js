import pool from "../config.js/db.js";

export const leadPostController = async (req,res)=>{
    const {firstName,lastName,email,phone,message} = req.body;
    try {
        if(!firstName || !lastName || !email || !phone){
            return res.status(400).json({message:"All red star fields are required.So,Please fill first then submit."})
        }
        await pool.query('insert into demo_requests (firstname,lastname,email,phone,message) value (?,?,?,?,?)',[firstName,lastName,email,phone,message])
        res.json({message:"Demo-request stored successfully."})
    } catch (error) {
        return res.status(500).json({message:"Something went wrong"})
    }
}


export const leadUpdateController = async(req,res)=>{
    let {id,newValue} = req.body;
    try {
        let [exist] = await pool.query('select * from demo_requests');
        if(exist.length===0){
            return res.status(400).json({message:"Data not exist"});
        }
        let data = await pool.query('update demo_requests set status=? where id=?',[newValue,id]);
        res.json({message:"Successfully updated"})
    } catch (error) {
        res.status(500).json({message:"Server Internal Error"})
    }
}