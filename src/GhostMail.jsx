export async function verifyEmailWithGhostMail(email) {
    const accessKey = import.meta.env.VITE_Mailboxlayer;
    const url = `https://apilayer.net/api/check?access_key=${accessKey}&email=${encodeURIComponent(email)}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log("📬 Verifica GhostMail:", data);
        if (data.success === false) {
            return { valid: false, reason: "API error" };
        }

        if (!data.format_valid || data.disposable || data.smtp_check === false) {
            return { valid: false, reason: "invalid_email" };
        }

        return { valid: true };
    } catch (err) {
        return { valid: false, reason: "network_error" };
    }
}