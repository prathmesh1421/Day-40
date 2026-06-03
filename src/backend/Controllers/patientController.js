const db = require("../config/db");

// GET ALL PATIENTS
exports.getPatients = (req, res) => {
  const sql = "SELECT * FROM patients ORDER BY id DESC";

  db.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json(err);
    }

    res.json(result);
  });
};

// ADD PATIENT
exports.addPatient = (req, res) => {
  const { name, age, disease } = req.body;

  if (!name || !age || !disease) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  const sql = "INSERT INTO patients (name, age, disease) VALUES (?, ?, ?)";

  db.query(sql, [name, age, disease], (err, result) => {
    if (err) {
      console.log("Insert Error:", err);
      return res.status(500).json(err);
    }

    res.status(201).json({
      success: true,
      message: "Patient added successfully",
      id: result.insertId,
    });
  });
};

// UPDATE PATIENT
exports.updatePatient = (req, res) => {
  const { id } = req.params;
  const { name, age, disease } = req.body;

  const sql = "UPDATE patients SET name=?, age=?, disease=? WHERE id=?";

  db.query(sql, [name, age, disease, id], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json(err);
    }

    res.json({
      success: true,
      message: "Patient updated",
    });
  });
};

// DELETE PATIENT
exports.deletePatient = (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM patients WHERE id=?", [id], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json(err);
    }

    res.json({
      success: true,
      message: "Patient deleted",
    });
  });
};
