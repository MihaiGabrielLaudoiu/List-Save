const { consultaDatos } = require("../../config/db");

async function getSettings(req, res) {
  const userId = req.user.user_id;

  try {
    const rows = await consultaDatos(
      "SELECT user_id, language, postal_code, card_last4, card_name, updated_at FROM AjustesUsuario WHERE user_id = ? LIMIT 1",
      [userId]
    );

    if (rows.length === 0) {
      res.json({
        settings: {
          user_id: userId,
          language: "es",
          postal_code: "",
          card_last4: "",
          card_name: ""
        }
      });
      return;
    }

    res.json({ settings: rows[0] });
  } catch (error) {
    console.error("Error en getSettings:", error);
    res.status(500).json({ message: "No se pudo cargar la configuracion" });
  }
}

async function updateSettings(req, res) {
  const userId = req.user.user_id;
  const language = req.body.language || "es";
  const postalCode = req.body.postalCode || "";
  const cardNumberRaw = String(req.body.cardNumber || "").replace(/\s/g, "");
  const cardName = req.body.cardName || "";

  let cardLast4 = "";
  const soloDigitos = /^[0-9]{12,19}$/.test(cardNumberRaw);

  if (soloDigitos && cardNumberRaw.length >= 4) {
    cardLast4 = cardNumberRaw.slice(cardNumberRaw.length - 4);
  }

  try {
    const existing = await consultaDatos(
      "SELECT user_id FROM AjustesUsuario WHERE user_id = ? LIMIT 1",
      [userId]
    );

    if (existing.length > 0) {
      if (soloDigitos) {
        await consultaDatos(
          "UPDATE AjustesUsuario SET language = ?, postal_code = ?, card_last4 = ?, card_name = ?, updated_at = NOW() WHERE user_id = ?",
          [language, postalCode, cardLast4, cardName, userId]
        );
      } else {
        await consultaDatos(
          "UPDATE AjustesUsuario SET language = ?, postal_code = ?, card_name = ?, updated_at = NOW() WHERE user_id = ?",
          [language, postalCode, cardName, userId]
        );
      }
    } else {
      await consultaDatos(
        "INSERT INTO AjustesUsuario (user_id, language, postal_code, card_last4, card_name, updated_at) VALUES (?, ?, ?, ?, ?, NOW())",
        [userId, language, postalCode, soloDigitos ? cardLast4 : "", cardName]
      );
    }

    res.json({ message: "Configuracion guardada correctamente" });
  } catch (error) {
    console.error("Error en updateSettings:", error);
    res.status(500).json({ message: "No se pudo guardar la configuracion" });
  }
}

module.exports = {
  getSettings,
  updateSettings
};
