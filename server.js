import express from 'express';
import authRouter from './routes/authRoutes.js'
import cors from 'cors'
import cookieParser from 'cookie-parser';
const app = express();

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin:'http://localhost:3001',
    credentials:true
}))
app.use('/auth',authRouter)

app.get('/',(req,res)=>{
    res.send('Hello from backend')
});

app.listen(4000,()=>{
    console.log('Your server started...🔥🔥🔥')
})