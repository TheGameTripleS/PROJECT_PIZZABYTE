// Admin credentials are stored in .env as ADMIN_USERNAME and ADMIN_EMAIL.
// This is a simple credential check — no JWT yet (will be added later).

export const adminLogin = async (req, res) => {
    const { username, email } = req.body;

    if (!username || !email) {
        return res.status(400).json({ success: false, message: "Username and email are required" });
    }

    const validUsername = process.env.ADMIN_USERNAME;
    const validEmail    = process.env.ADMIN_EMAIL;

    if (username === validUsername && email === validEmail) {
        return res.status(200).json({ success: true, message: "Login successful" });
    }

    return res.status(401).json({ success: false, message: "Invalid username or email" });
};
