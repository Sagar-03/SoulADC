import React, { useState, useEffect, useCallback } from "react";
import { Table, Button, Form, Modal, Badge, Spinner, Alert } from "react-bootstrap";
import { FaPlus, FaTrash, FaToggleOn, FaToggleOff, FaDice } from "react-icons/fa";
import AdminLayout from "./AdminLayout";
import {
  getDiscountCodes,
  createDiscountCode,
  toggleDiscountCode,
  deleteDiscountCode,
} from "../../Api/api";

export default function DiscountCodes() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ discountPercent: "", code: "" });
  const [formError, setFormError] = useState("");

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await getDiscountCodes();
      setCodes(data.codes || []);
    } catch (err) {
      setError("Failed to load discount codes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const generateRandom = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "SOUL-";
    for (let i = 0; i < 8; i++) result += chars[Math.floor(Math.random() * chars.length)];
    setForm((f) => ({ ...f, code: result }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    const pct = parseInt(form.discountPercent);
    if (!pct || pct < 1 || pct > 100) {
      setFormError("Discount must be between 1% and 100%");
      return;
    }
    setCreating(true);
    try {
      await createDiscountCode({ discountPercent: pct, code: form.code || undefined });
      setShowModal(false);
      setForm({ discountPercent: "", code: "" });
      fetchCodes();
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to create discount code");
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const { data } = await toggleDiscountCode(id);
      setCodes((prev) => prev.map((c) => (c._id === id ? data.code : c)));
    } catch {
      setError("Failed to toggle discount code");
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete discount code "${code}"? This cannot be undone.`)) return;
    try {
      await deleteDiscountCode(id);
      setCodes((prev) => prev.filter((c) => c._id !== id));
    } catch {
      setError("Failed to delete discount code");
    }
  };

  return (
    <AdminLayout>
      <div className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold mb-0">Discount Codes</h3>
            <p className="text-muted small mb-0">Create and manage discount codes for payments</p>
          </div>
          <Button
            variant="primary"
            className="d-flex align-items-center gap-2"
            onClick={() => { setShowModal(true); setFormError(""); setForm({ discountPercent: "", code: "" }); }}
          >
            <FaPlus /> New Code
          </Button>
        </div>

        {error && <Alert variant="danger" onClose={() => setError("")} dismissible>{error}</Alert>}

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : codes.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <p className="fs-5">No discount codes yet.</p>
            <p>Click <strong>New Code</strong> to create one.</p>
          </div>
        ) : (
          <Table bordered hover responsive className="align-middle">
            <thead className="table-dark">
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Status</th>
                <th>Usage</th>
                <th>Created</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((dc) => (
                <tr key={dc._id}>
                  <td>
                    <code className="fs-6 fw-bold text-dark">{dc.code}</code>
                  </td>
                  <td>
                    <Badge bg="success" className="fs-6">{dc.discountPercent}% OFF</Badge>
                  </td>
                  <td>
                    <Badge bg={dc.isActive ? "primary" : "secondary"}>
                      {dc.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td>{dc.usageCount} {dc.usageCount === 1 ? "use" : "uses"}</td>
                  <td>{new Date(dc.createdAt).toLocaleDateString()}</td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-2">
                      <Button
                        size="sm"
                        variant={dc.isActive ? "outline-warning" : "outline-success"}
                        title={dc.isActive ? "Deactivate" : "Activate"}
                        onClick={() => handleToggle(dc._id)}
                        className="d-flex align-items-center gap-1"
                      >
                        {dc.isActive ? <FaToggleOff /> : <FaToggleOn />}
                        {dc.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        title="Delete"
                        onClick={() => handleDelete(dc._id, dc.code)}
                        className="d-flex align-items-center gap-1"
                      >
                        <FaTrash /> Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      {/* Create Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create Discount Code</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreate}>
          <Modal.Body>
            {formError && <Alert variant="danger">{formError}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Discount Percentage <span className="text-danger">*</span></Form.Label>
              <div style={{ display: "flex", alignItems: "stretch" }}>
                <input
                  type="number"
                  min={1}
                  max={100}
                  placeholder="e.g. 10"
                  value={form.discountPercent}
                  onChange={(e) => setForm((f) => ({ ...f, discountPercent: e.target.value }))}
                  required
                  style={{
                    flex: 1,
                    border: "1px solid #ced4da",
                    borderRight: "none",
                    borderRadius: "0.375rem 0 0 0.375rem",
                    padding: "0.375rem 0.75rem",
                    fontSize: "1rem",
                    outline: "none",
                  }}
                />
                <span style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "0.375rem 0.75rem",
                  background: "#e9ecef",
                  border: "1px solid #ced4da",
                  borderRadius: "0 0.375rem 0.375rem 0",
                  fontSize: "1rem",
                  color: "#495057",
                }}>%</span>
              </div>
              <Form.Text className="text-muted">Enter a value between 1 and 100.</Form.Text>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label className="fw-medium">Discount Code</Form.Label>
              <div className="d-flex gap-2">
                <Form.Control
                  type="text"
                  placeholder="Leave blank to auto-generate"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  style={{ textTransform: "uppercase", letterSpacing: "1px" }}
                />
                <Button
                  type="button"
                  variant="outline-secondary"
                  title="Generate random code"
                  onClick={generateRandom}
                  className="d-flex align-items-center gap-1 text-nowrap"
                >
                  <FaDice /> Generate
                </Button>
              </div>
              <Form.Text className="text-muted">Leave blank to auto-generate a random code.</Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={creating}>
              {creating ? <><Spinner size="sm" /> Creating...</> : "Create Code"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </AdminLayout>
  );
}
