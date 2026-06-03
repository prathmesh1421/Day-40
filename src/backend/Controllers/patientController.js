const db = require("../config/db");

exports.getPatients = (req, res) => {
  db.query("SELECT * FROM patients", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

exports.getPatientById = (req, res) => {
  db.query(
    "SELECT * FROM patients WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    },
  );
};

exports.addPatient = (req, res) => {
  const { name, age, disease } = req.body;

  db.query(
    "INSERT INTO patients (name, age, disease) VALUES (?, ?, ?)",
    [name, age, disease],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Patient added successfully" });
    },
  );
};

exports.deletePatient = (req, res) => {
  db.query(
    "DELETE FROM patients WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Patient deleted successfully" });
    },
  );
};
