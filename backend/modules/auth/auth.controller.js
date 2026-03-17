const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { consultaDatos } = require("../../config/db");
const { createAuthToken, setAuthCookie, clearAuthCookie } = require("../../utils/token");
const { saveUserSession, destroyUserSession } = require("../../utils/session-redis");

async function register(req, res) {
  const email = req.body.email;
  const password = req.body.password;
  const fullname = req.body.fullname;

  if (!email || !password || !fullname) {
    res.status(400).json({ message: "Faltan campos obligatorios" });
    return;
  }

  try {
    const existingUsers = await consultaDatos(
      "SELECT user_id FROM Usuarios WHERE email = ? LIMIT 1",
      [email]
    );

    if (existingUsers.length > 0) {
      res.status(409).json({ message: "El email ya esta registrado" });
      return;
    }

    const hash = await bcrypt.hash(password, 10);

    const insertResult = await consultaDatos(
      "INSERT INTO Usuarios (email, password, fullname) VALUES (?, ?, ?)",
      [email, hash, fullname]
    );

    const newUserId = insertResult.insertId;

    await consultaDatos(
      "INSERT INTO AjustesUsuario (user_id, language) VALUES (?, ?)",
      [newUserId, "es"]
    );

    await consultaDatos(
      "INSERT INTO ListasCabecera (user_id, nombre) VALUES (?, ?)",
      [newUserId, "Mi lista"]
    );

    const { token, jti } = createAuthToken({
      user_id: newUserId,
      email: email,
      fullname: fullname,
    });

    await saveUserSession(newUserId, jti);
    setAuthCookie(res, token);

    res.status(201).json({
      message: "Usuario registrado correctamente",
      user: {
        user_id: newUserId,
        email: email,
        fullname: fullname
      }
    });
  } catch (error) {
    console.error("Error en register:", error);
    if (error.code === "ER_NO_SUCH_TABLE" || error.errno === 1146) {
      res.status(503).json({
        message:
          "La base de datos no esta actualizada (falta una tabla). Ejecuta las migraciones en backend/db/, por ejemplo migration-listas-cabecera.sql"
      });
      return;
    }
    res.status(500).json({ message: "No se pudo registrar el usuario" });
  }
}

async function login(req, res) {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    res.status(400).json({ message: "Email y contrasena son obligatorios" });
    return;
  }

  try {
    const users = await consultaDatos(
      "SELECT user_id, email, password, fullname FROM Usuarios WHERE email = ? LIMIT 1",
      [email]
    );

    if (users.length === 0) {
      res.status(401).json({ message: "Credenciales incorrectas" });
      return;
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      res.status(401).json({ message: "Credenciales incorrectas" });
      return;
    }

    const { token, jti } = createAuthToken({
      user_id: user.user_id,
      email: user.email,
      fullname: user.fullname,
    });

    await saveUserSession(user.user_id, jti);
    setAuthCookie(res, token);

    res.json({
      message: "Login correcto",
      user: {
        user_id: user.user_id,
        email: user.email,
        fullname: user.fullname
      }
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "No se pudo iniciar sesion" });
  }
}

async function logout(req, res) {
  try {
    const token = req.cookies.auth_token;
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        await destroyUserSession(payload.user_id);
      } catch (e) {
        // token caducado o invalido: solo borramos cookie
      }
    }
    clearAuthCookie(res);
    res.json({ message: "Sesion cerrada" });
  } catch (err) {
    console.error("Error en logout:", err);
    clearAuthCookie(res);
    res.json({ message: "Sesion cerrada" });
  }
}

async function me(req, res) {
  const userId = req.user.user_id;

  try {
    const rows = await consultaDatos(
      "SELECT U.user_id, U.email, U.fullname, A.language, A.postal_code FROM Usuarios U LEFT JOIN AjustesUsuario A ON U.user_id = A.user_id WHERE U.user_id = ? LIMIT 1",
      [userId]
    );

    if (rows.length === 0) {
      res.status(404).json({ message: "Usuario no encontrado" });
      return;
    }

    res.json({ user: rows[0] });
  } catch (error) {
    console.error("Error en me:", error);
    res.status(500).json({ message: "No se pudo cargar la sesion" });
  }
}

module.exports = {
  register,
  login,
  logout,
  me
};
