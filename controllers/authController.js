import pool from "../config.js/db.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import sendEmail from "../utils/sendMail.js";
import jwt from 'jsonwebtoken';


const register = async (req, res) => {
    try {
        let { fullName, email, password, confirmPassword } = req.body;

        // validations
        if (!fullName || !email || !password || !confirmPassword) {
            return res.json({ message: "All fields are required" });
        }

        if (password.length < 8) {
            return res.json({ message: "Password must be at least 8 characters" });
        }

        if (password !== confirmPassword) {
            return res.json({ message: "Passwords do not match" });
        }

        // check if user already exists
        const [existingUser] = await pool.query(
            "SELECT * FROM users WHERE email=?",
            [email]
        );

        if (existingUser.length > 0) {
            return res.json({ message: "Email already registered" });
        }

        // hash password
        let hashedPassword = await bcrypt.hash(password, 10);

        // insert user (inactive)
        const [result] = await pool.query(
            "INSERT INTO users (full_name,email,password,is_verified,is_active) VALUES (?,?,?,?,?)",
            [fullName, email, hashedPassword, false, false]
        );

        const userId = result.insertId;

        // generate token
        const token = crypto.randomBytes(32).toString("hex");

        // store token
        await pool.query(
            "INSERT INTO tokens (user_id, token, type, expires_at) VALUES (?,?,?,?)",
            [userId, token, "verify", new Date(Date.now() + 3600000)]
        );

        // create verification link
        const link = `http://localhost:3001/verify?token=${token}`;

        //email send karna
        // console.log("Verification Link:", link);
        await sendEmail(
            email,
            "Verify your email",
            `   <h2>Welcome ${fullName}</h2>
                <p>Click below to verify your email:</p>
                <a href="${link}" style="padding:10px 15px;background:blue;color:white;">
                    Verify Email
                </a>
            `
        );

        res.json({ message: "Verification email sent successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};


const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        const [data] = await pool.query(
            "SELECT * FROM tokens WHERE token=? AND type='verify'",
            [token]
        );

        if (!data.length) {
            return res.json({ message: "Invalid token" });
        }

        const tokenData = data[0];

        // expiry check
        if (new Date(tokenData.expires_at) < new Date()) {
            return res.json({ message: "Token expired" });
        }

        // activate user
        await pool.query(
            "UPDATE users SET is_verified=1, is_active=1 WHERE id=?",
            [tokenData.user_id]
        );

        // delete token
        await pool.query("DELETE FROM tokens WHERE token=?", [token]);

        return res.json({ message: "Email verified successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // check user exists
        const [rows] = await pool.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const user = rows[0];

        // password check
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        // generate token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
            },
            "SECRET_KEYS",
            { expiresIn: "1h" }
        );

        // set cookie
        res.cookie("access_token", token, {
            httpOnly: true,
            secure: false, // dev
            sameSite: "lax",
            path: "/",
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user.id,
                email: user.email,
            },
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

const logout = async (req, res) => {
    res.clearCookie("access_token", {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
    });

    res.json({ message: "Logged out successfully" });
}

const forgetController = async (req, res) => {
    try {
        let { email } = req.body;
        let [exist] = await pool.query('select * from users where email=?', [email]);
        if (exist.length === 0) {
            return res.status(404).json({ message: 'User not found' })
        };

        let user = exist[0];
        // generate token
        const token = crypto.randomBytes(32).toString("hex");

        // store token
        await pool.query(
            "INSERT INTO tokens (user_id, token, type, expires_at) VALUES (?,?,?,?)",
            [user.id, token, "reset", new Date(Date.now() + 3600000)]
        );

        // create verification link
        const link = `http://localhost:3001/verify-email?token=${token}`;

        //email send karna
        // console.log("Verification Link:", link);
        await sendEmail(
            email,
            "Verify your email",
            `   <h2>Welcome ${user.full_name}</h2>
                <p>Click below to verify your email:</p>
                <a href="${link}" style="padding:10px 15px;background:blue;color:white;">
                    Verify Email
                </a>
            `
        );

        res.json({ message: "Verification email sent successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }

}

const verifyEmailController = async (req,res)=>{
    try {
        const { token } = req.query;

        const [data] = await pool.query(
            "SELECT * FROM tokens WHERE token=? AND type='reset'",
            [token]
        );

        if (!data.length) {
            return res.json({ message: "Invalid token" ,url:"sign-In"});
        }

        const tokenData = data[0];

        // expiry check
        if (new Date(tokenData.expires_at) < new Date()) {
            return res.json({ message: "Token expired",url:"sign-In" });
        }

        // // activate user
        // await pool.query(
        //     "UPDATE users SET is_verified=1, is_active=1 WHERE id=?",
        //     [tokenData.user_id]
        // );

        // delete token
        // await pool.query("DELETE FROM tokens WHERE token=?", [token]);

        return res.json({ message: "Email verified successfully",url:"new-password" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error",url:"sign-In" });
    }
}


const changePasswordController = async (req, res) => {
    try {
        const { password, confirmPassword, token } = req.body;

        if (!token) {
            return res.status(400).json({ message: "Token missing" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        // find token in DB
        const [data] = await pool.query(
            "SELECT * FROM tokens WHERE token=? AND type='reset'",
            [token]
        );

        if (!data.length) {
            return res.status(400).json({ message: "Invalid token" });
        }

        const tokenData = data[0];

        // expiry check
        if (new Date(tokenData.expires_at) < new Date()) {
            return res.status(400).json({ message: "Token expired" });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // update password
        await pool.query(
            "UPDATE users SET password=? WHERE id=?",
            [hashedPassword, tokenData.user_id]
        );

        // delete token after use 🔥
        await pool.query(
            "DELETE FROM tokens WHERE token=?",
            [token]
        );

        return res.json({ message: "Password updated successfully" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

export { register, verifyEmail, login, logout, forgetController, verifyEmailController, changePasswordController }