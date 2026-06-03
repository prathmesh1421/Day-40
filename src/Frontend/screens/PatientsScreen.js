import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { FadeIn } from "react-native-reanimated";

// ─── CONFIG ────────────────────────────────────────────────────
// Android Emulator: http://10.0.2.2:3000/api/patients
// iOS Simulator: http://localhost:3000/api/patients
// Real Device: http://YOUR_PC_IP:3000/api/patients

// (No axios instance used in mock mode)

// ─── MOCK DATA ─────────────────────────────────────────────────
// You can use this to test locally or as a reference for your DB
const MOCK_PATIENTS = [
  {
    id: 1,
    name: "John Doe",
    age: "45",
    disease: "Diabetes Type 2",
  },
];

// ─── API HELPERS (WITH MOCK) ────────────────────────────────
const api = {
  getPatients: async () => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return MOCK_PATIENTS;
  },

  addPatient: async (patient) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newPatient = {
      ...patient,
      id: MOCK_PATIENTS.length + 1,
    };
    MOCK_PATIENTS.unshift(newPatient);
    return newPatient;
  },

  updatePatient: async (id, patient) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = MOCK_PATIENTS.findIndex((p) => p.id === id);
    if (index > -1) {
      MOCK_PATIENTS[index] = { ...MOCK_PATIENTS[index], ...patient };
      return MOCK_PATIENTS[index];
    }
    throw new Error("Patient not found");
  },

  deletePatient: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = MOCK_PATIENTS.findIndex((p) => p.id === id);
    if (index > -1) {
      MOCK_PATIENTS.splice(index, 1);
      return true;
    }
    throw new Error("Patient not found");
  },
};
// ─── EDIT MODAL ────────────────────────────────────────────────
const EditModal = ({ visible, patient, onClose, onSave, saving }) => {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [disease, setDisease] = useState("");

  useEffect(() => {
    if (patient) {
      setName(patient.name);
      setAge(patient.age);
      setDisease(patient.disease);
    }
  }, [patient]);

  const handleSave = () => {
    if (!name.trim() || !age.trim() || !disease.trim()) {
      Alert.alert("Error", "All fields are required");
      return;
    }
    onSave(patient.id, {
      name: name.trim(),
      age: age.trim(),
      disease: disease.trim(),
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>✏️ Edit Patient</Text>

          <Text style={styles.inputLabel}>Patient Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter patient name"
            placeholderTextColor="#a5b4fc"
          />

          <Text style={styles.inputLabel}>Age</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="Enter age"
            placeholderTextColor="#a5b4fc"
            keyboardType="numeric"
          />

          <Text style={styles.inputLabel}>Disease / Condition</Text>
          <TextInput
            style={styles.input}
            value={disease}
            onChangeText={setDisease}
            placeholder="Enter disease"
            placeholderTextColor="#a5b4fc"
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.disabledButton]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── PATIENT CARD ──────────────────────────────────────────────
const PatientCard = ({ item, index, onDelete, onEdit, deleting }) => {
  const animationEnter = FadeIn.delay(index * 80).duration(400);

  return (
    <Animated.View entering={animationEnter} style={styles.patientContainer}>
      <View style={styles.patientCard}>
        <View style={styles.cardTopRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>🧑‍⚕️</Text>
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.patientAge}>Age: {item.age}</Text>
            <Text style={styles.patientId}>
              ID: #{String(item.id).slice(-4)}
            </Text>
          </View>
        </View>

        <View style={styles.diseaseBadgeRow}>
          <View style={styles.diseaseBadge}>
            <Text style={styles.diseaseText} numberOfLines={1}>
              🩺 {item.disease}
            </Text>
          </View>
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => onEdit(item)}
          >
            <Text style={styles.actionText}>✏️ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteButton, deleting && styles.disabledButton]}
            onPress={() => onDelete(item.id)}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.actionText}>🗑 Delete</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

// ─── MAIN SCREEN ───────────────────────────────────────────────
export default function PatientsScreen({ navigation }) {
  const [patients, setPatients] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [disease, setDisease] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editModal, setEditModal] = useState({ visible: false, patient: null });

  // ── FETCH DATA ─────────────────────────────────────────────
  const fetchPatients = async () => {
    try {
      console.log("Loading patients...");
      const result = await api.getPatients();
      console.log("API Result:", result);

      // Handle different response structures
      let incoming = [];
      if (Array.isArray(result)) {
        incoming = result;
      } else if (result && Array.isArray(result.data)) {
        incoming = result.data;
      } else if (result && Array.isArray(result.patients)) {
        incoming = result.patients;
      } else {
        console.warn("Unexpected data format:", result);
        incoming = [];
      }

      setPatients(incoming);
    } catch (err) {
      console.error("Fetch Error:", err);
      Alert.alert("Error", err.message || "Could not load patients");
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPatients();
    setRefreshing(false);
  }, []);

  // ── ADD PATIENT ─────────────────────────────────────────────
  const handleAdd = async () => {
    if (!name.trim() || !age.trim() || !disease.trim()) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    setAdding(true);
    try {
      const newPatient = await api.addPatient({
        name: name.trim(),
        age: age.trim(),
        disease: disease.trim(),
      });
      setPatients((prev) => [newPatient, ...prev]);
      setName("");
      setAge("");
      setDisease("");
    } catch (err) {
      Alert.alert("Error", err.message || "Could not add patient");
    } finally {
      setAdding(false);
    }
  };

  // ── EDIT PATIENT ────────────────────────────────────────────
  const handleEdit = (patient) => setEditModal({ visible: true, patient });

  const handleSaveEdit = async (id, updatedFields) => {
    setSaving(true);
    try {
      const updated = await api.updatePatient(id, updatedFields);
      setPatients((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updated } : p)),
      );
      setEditModal({ visible: false, patient: null });
    } catch (err) {
      Alert.alert("Error", err.message || "Could not update patient");
    } finally {
      setSaving(false);
    }
  };

  // ── DELETE PATIENT ────────────────────────────────────────
  const handleDelete = (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this patient?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingId(id);
            try {
              await api.deletePatient(id);
              setPatients((prev) => prev.filter((p) => p.id !== id));
            } catch (err) {
              Alert.alert("Error", err.message || "Could not delete patient");
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  const handleLogout = () =>
    navigation.getParent().reset({ index: 0, routes: [{ name: "Login" }] });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSub}>Hospital System</Text>
            <Text style={styles.headerTitle}>Patients</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={patients}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#6366f1"]}
              tintColor="#6366f1"
            />
          }
          ListHeaderComponent={
            <>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconWrap}>
                    <Text style={styles.cardIconEmoji}>🧑‍⚕️</Text>
                  </View>
                  <Text style={styles.cardTitle}>Add Patient</Text>
                </View>

                <Text style={styles.inputLabel}>Patient Name</Text>
                <TextInput
                  placeholder="Enter patient name"
                  placeholderTextColor="#a5b4fc"
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                />

                <Text style={styles.inputLabel}>Age</Text>
                <TextInput
                  placeholder="Enter patient age"
                  placeholderTextColor="#a5b4fc"
                  style={styles.input}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                />

                <Text style={styles.inputLabel}>Disease / Condition</Text>
                <TextInput
                  placeholder="Enter disease or condition"
                  placeholderTextColor="#a5b4fc"
                  style={styles.input}
                  value={disease}
                  onChangeText={setDisease}
                />

                <TouchableOpacity
                  style={[styles.button, adding && styles.disabledButton]}
                  onPress={handleAdd}
                  disabled={adding}
                >
                  {adding ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Add Patient 🚀</Text>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>
                Patient Records ({patients.length})
              </Text>
            </>
          }
          renderItem={({ item, index }) => (
            <PatientCard
              item={item}
              index={index}
              onDelete={handleDelete}
              onEdit={handleEdit}
              deleting={deletingId === item.id}
            />
          )}
          ListEmptyComponent={
            !refreshing ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyEmoji}>📭</Text>
                <Text style={styles.emptyTitle}>No Patients Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Add your first patient above
                </Text>
              </View>
            ) : null
          }
        />

        <EditModal
          visible={editModal.visible}
          patient={editModal.patient}
          onClose={() => setEditModal({ visible: false, patient: null })}
          onSave={handleSaveEdit}
          saving={saving}
        />
      </View>
    </GestureHandlerRootView>
  );
}

// ─── STYLES ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4ff" },

  // Header
  header: {
    backgroundColor: "#1e1b4b",
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerSub: { color: "#a5b4fc", fontSize: 13, marginBottom: 4 },
  headerTitle: { color: "#ffffff", fontSize: 28, fontWeight: "bold" },
  logoutBtn: {
    backgroundColor: "#312e81",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "#4338ca",
  },
  logoutText: { color: "#a5b4fc", fontSize: 14, fontWeight: "bold" },

  // List
  listContent: { padding: 20, paddingBottom: 100 },

  // Add Patient Card
  card: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: "#e0e7ff",
    elevation: 4,
    marginTop: 24,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#e0e7ff",
    alignItems: "center",
    justifyContent: "center",
  },
  cardIconEmoji: { fontSize: 22 },
  cardTitle: { fontSize: 20, fontWeight: "bold", color: "#1e1b4b" },

  // Inputs
  inputLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#4338ca",
    marginBottom: 6,
    marginLeft: 2,
  },
  input: {
    backgroundColor: "#eef2ff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#c7d2fe",
    color: "#1e1b4b",
  },

  // Buttons
  button: {
    backgroundColor: "#1e1b4b",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 6,
  },
  buttonText: { color: "#ffffff", fontSize: 17, fontWeight: "bold" },
  disabledButton: { opacity: 0.6 },

  // Section Title
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 32,
    marginBottom: 16,
    color: "#1e1b4b",
  },

  // Patient Card
  patientContainer: {
    width: "100%",
    marginBottom: 14,
    borderRadius: 20,
    overflow: "hidden",
  },
  patientCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "#e0e7ff",
    elevation: 3,
  },
  cardTopRow: { flexDirection: "row", alignItems: "center" },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e0e7ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 22 },
  patientInfo: { flex: 1 },
  patientName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e1b4b",
    marginBottom: 3,
    flexWrap: "wrap",
  },
  patientAge: { fontSize: 13, color: "#6366f1", marginBottom: 2 },
  patientId: { fontSize: 12, color: "#94a3b8" },
  diseaseBadgeRow: { marginTop: 10, flexDirection: "row" },
  diseaseBadge: {
    backgroundColor: "#eef2ff",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: "#c7d2fe",
    alignSelf: "flex-start",
  },
  diseaseText: { fontSize: 12, fontWeight: "bold", color: "#4338ca" },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 14,
  },
  editButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 80,
    alignItems: "center",
  },
  actionText: { color: "#fff", fontWeight: "bold", fontSize: 13 },

  // Footer Loader
  footerLoader: {
    marginTop: 10,
    marginBottom: 10,
    alignItems: "center",
    gap: 6,
  },
  footerText: { fontSize: 13, color: "#6366f1" },

  // Empty State
  emptyCard: {
    backgroundColor: "#ffffff",
    padding: 36,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#e0e7ff",
    marginTop: 20,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e1b4b",
    marginBottom: 6,
  },
  emptySubtitle: { fontSize: 13, color: "#6366f1", textAlign: "center" },

  // Edit Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#ffffff",
    padding: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e1b4b",
    marginBottom: 20,
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#c7d2fe",
    alignItems: "center",
  },
  cancelText: { color: "#6366f1", fontWeight: "bold", fontSize: 15 },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#1e1b4b",
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});
