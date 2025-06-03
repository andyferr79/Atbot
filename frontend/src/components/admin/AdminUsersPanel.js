// 📁 E:/ATBot/frontend/src/components/admin/AdminUsersPanel.js

import React, { useEffect, useState } from "react";
import api from "../../services/api";
import "./AdminUsersPanel.css";

const AdminUsersPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUid, setEditingUid] = useState(null);
  const [editedData, setEditedData] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("firebaseToken");
      const res = await api.get("/getAllUsers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
      setLoading(false);
    } catch (err) {
      console.error("❌ Errore caricamento utenti:", err);
    }
  };

  const handleEdit = (uid, role, plan) => {
    setEditingUid(uid);
    setEditedData({ role, plan });
  };

  const handleSave = async (uid) => {
    try {
      const token = localStorage.getItem("firebaseToken");
      await api.put(`/updateUser/${uid}`, editedData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEditingUid(null);
      fetchUsers();
    } catch (err) {
      console.error("❌ Errore salvataggio:", err);
    }
  };

  const handleDelete = async (uid) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo utente?")) return;
    try {
      const token = localStorage.getItem("firebaseToken");
      await api.delete(`/deleteUser/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (err) {
      console.error("❌ Errore eliminazione:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) return <p className="admin-loading">Caricamento utenti...</p>;

  return (
    <div className="admin-users-panel">
      <h2>Gestione Utenti</h2>
      <table className="users-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Ruolo</th>
            <th>Piano</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.uid}>
              <td>{user.email}</td>
              <td>
                {editingUid === user.uid ? (
                  <select
                    name="role"
                    value={editedData.role}
                    onChange={handleChange}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                ) : (
                  user.role
                )}
              </td>
              <td>
                {editingUid === user.uid ? (
                  <select
                    name="plan"
                    value={editedData.plan}
                    onChange={handleChange}
                  >
                    <option value="base">base</option>
                    <option value="gold">gold</option>
                  </select>
                ) : (
                  user.plan
                )}
              </td>
              <td>
                {editingUid === user.uid ? (
                  <button onClick={() => handleSave(user.uid)}>💾 Salva</button>
                ) : (
                  <button
                    onClick={() => handleEdit(user.uid, user.role, user.plan)}
                  >
                    ✏️ Modifica
                  </button>
                )}
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(user.uid)}
                >
                  🗑️ Elimina
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUsersPanel;
