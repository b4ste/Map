import { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner, Table } from "react-bootstrap";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const initialForm = {
  firstname: "",
  lastname: "",
  course: "",
  email: "",
  address: "",
};

const courses = ["BSIT", "BSCS", "BSIS", "BSA", "BSEMC"];

const defaultCenter = [14.5995, 120.9842];

function MapFocus({ students }) {
  const map = useMap();

  useEffect(() => {
    if (students.length === 0) {
      map.setView(defaultCenter, 11);
      return;
    }

    const bounds = L.latLngBounds(students.map((student) => [student.latitude, student.longitude]));
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 16 });
  }, [map, students]);

  return null;
}

function App() {
  const [form, setForm] = useState(initialForm);
  const [students, setStudents] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const validateForm = () => {
    const nextErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    Object.entries(form).forEach(([field, value]) => {
      if (!value.trim()) {
        nextErrors[field] = "This field is required.";
      }
    });

    if (form.email.trim() && !emailPattern.test(form.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(form.address)}`,
        {
          headers: {
            "Accept-Language": "en",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Unable to contact the geocoding service.");
      }

      const data = await response.json();
      if (data.length === 0) {
        setErrors({ address: "Address not found. Please enter a more specific address." });
        return;
      }

      const location = data[0];
      const newStudent = {
        id: crypto.randomUUID(),
        firstname: form.firstname.trim(),
        lastname: form.lastname.trim(),
        course: form.course.trim(),
        email: form.email.trim(),
        address: location.display_name,
        latitude: Number(location.lat),
        longitude: Number(location.lon),
      };

      setStudents((current) => [...current, newStudent]);
      setForm(initialForm);
      setErrors({});
      setMessage(`${newStudent.firstname} ${newStudent.lastname} was registered successfully.`);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong while locating the address. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (studentId) => {
    setStudents((current) => current.filter((student) => student.id !== studentId));
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <Container fluid="xl" className="py-4 py-lg-5">
        <div className="mb-4 d-flex flex-column flex-lg-row align-items-lg-end justify-content-between gap-3">
          <div>
            <Badge bg="primary" className="mb-2">Student Location System</Badge>
            <h1 className="mb-2 fs-2 fw-bold">React Student Location System</h1>
            <p className="mb-0 text-secondary">
              Register students, convert their address to map coordinates, and manage records in one place.
            </p>
          </div>
          <div className="rounded border bg-white px-3 py-2 shadow-sm">
            <span className="text-secondary">Registered students</span>
            <span className="ms-2 fw-bold text-primary">{students.length}</span>
          </div>
        </div>

        {message && (
          <Alert variant={message.includes("wrong") ? "danger" : "success"} onClose={() => setMessage("")} dismissible>
            {message}
          </Alert>
        )}

        <Row className="g-4">
          <Col lg={4}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <Card.Title className="mb-3 fs-5">Student Registration</Card.Title>
                <Form noValidate onSubmit={handleSubmit}>
                  <Row className="g-3">
                    <Col md={6} lg={12} xl={6}>
                      <Form.Group controlId="firstname">
                        <Form.Label>Firstname</Form.Label>
                        <Form.Control
                          name="firstname"
                          value={form.firstname}
                          onChange={handleChange}
                          isInvalid={Boolean(errors.firstname)}
                          placeholder="Juan"
                        />
                        <Form.Control.Feedback type="invalid">{errors.firstname}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={6} lg={12} xl={6}>
                      <Form.Group controlId="lastname">
                        <Form.Label>Lastname</Form.Label>
                        <Form.Control
                          name="lastname"
                          value={form.lastname}
                          onChange={handleChange}
                          isInvalid={Boolean(errors.lastname)}
                          placeholder="Dela Cruz"
                        />
                        <Form.Control.Feedback type="invalid">{errors.lastname}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col xs={12}>
                      <Form.Group controlId="course">
                        <Form.Label>Course</Form.Label>
                        <Form.Select
                          name="course"
                          value={form.course}
                          onChange={handleChange}
                          isInvalid={Boolean(errors.course)}
                        >
                          <option value="">Select course</option>
                          {courses.map((course) => (
                            <option key={course} value={course}>
                              {course}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">{errors.course}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col xs={12}>
                      <Form.Group controlId="email">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          isInvalid={Boolean(errors.email)}
                          placeholder="student@example.com"
                        />
                        <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col xs={12}>
                      <Form.Group controlId="address">
                        <Form.Label>Address</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          name="address"
                          value={form.address}
                          onChange={handleChange}
                          isInvalid={Boolean(errors.address)}
                          placeholder="Enter a complete address"
                        />
                        <Form.Control.Feedback type="invalid">{errors.address}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Button type="submit" disabled={loading} className="mt-4 w-100">
                    {loading && <Spinner animation="border" size="sm" className="me-2" />}
                    {loading ? "Locating address" : "Register Student"}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={8}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-0">
                <div className="d-flex align-items-center justify-content-between border-bottom px-4 py-3">
                  <div>
                    <h2 className="mb-1 fs-5">Student Map</h2>
                    <p className="mb-0 small text-secondary">Markers update when students are added or deleted.</p>
                  </div>
                  <Badge bg="success">{students.length} marker{students.length === 1 ? "" : "s"}</Badge>
                </div>

                <div className="h-[420px] overflow-hidden rounded-bottom">
                  <MapContainer center={defaultCenter} zoom={11} scrollWheelZoom className="h-100 w-100">
                    <MapFocus students={students} />
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {students.map((student) => (
                      <Marker key={student.id} position={[student.latitude, student.longitude]}>
                        <Popup>
                          <strong>{student.firstname} {student.lastname}</strong>
                          <br />
                          {student.course}
                          <br />
                          {student.email}
                          <br />
                          {student.address}
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Card className="mt-4 border-0 shadow-sm">
          <Card.Body className="p-0">
            <div className="d-flex align-items-center justify-content-between border-bottom px-4 py-3">
              <div>
                <h2 className="mb-1 fs-5">Registered Students</h2>
                <p className="mb-0 small text-secondary">Student records are stored in React state.</p>
              </div>
            </div>

            <div className="table-responsive">
              <Table hover className="mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Course</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th>Coordinates</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-4 text-center text-secondary">
                        No students registered yet.
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.id}>
                        <td className="fw-semibold">{student.firstname} {student.lastname}</td>
                        <td>{student.course}</td>
                        <td>{student.email}</td>
                        <td className="min-w-[260px]">{student.address}</td>
                        <td>
                          <Badge bg="secondary" className="fw-normal">
                            {student.latitude.toFixed(5)}, {student.longitude.toFixed(5)}
                          </Badge>
                        </td>
                        <td className="text-end">
                          <Button variant="outline-danger" size="sm" onClick={() => handleDelete(student.id)}>
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </main>
  );
}

export default App;
