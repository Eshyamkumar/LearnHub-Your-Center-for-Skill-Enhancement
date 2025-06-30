import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Navbar, Nav, Container, Button, Dropdown, Form, InputGroup } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useCourse } from '../../contexts/CourseContext';
import './Navbar.css';

const NavigationBar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { setFilters } = useCourse();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setFilters({ search: searchTerm.trim() });
      navigate('/courses');
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <Navbar bg="white" expand="lg" fixed="top" className="navbar-custom">
      <Container>
        <Navbar.Brand as={Link} to="/" className="navbar-brand-custom">
          <i className="fas fa-graduation-cap me-2"></i>
          LearnHub
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link 
              as={Link} 
              to="/" 
              className={isActive('/') ? 'active' : ''}
            >
              Home
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/courses" 
              className={isActive('/courses') ? 'active' : ''}
            >
              Courses
            </Nav.Link>
            {isAuthenticated && (
              <>
                <Nav.Link 
                  as={Link} 
                  to="/my-courses" 
                  className={isActive('/my-courses') ? 'active' : ''}
                >
                  My Courses
                </Nav.Link>
                {(user?.role === 'instructor' || user?.role === 'admin') && (
                  <Nav.Link 
                    as={Link} 
                    to="/create-course" 
                    className={isActive('/create-course') ? 'active' : ''}
                  >
                    Create Course
                  </Nav.Link>
                )}
                {user?.role === 'admin' && (
                  <Nav.Link 
                    as={Link} 
                    to="/admin" 
                    className={isActive('/admin') ? 'active' : ''}
                  >
                    Admin
                  </Nav.Link>
                )}
              </>
            )}
          </Nav>

          {/* Search Bar */}
          <Form className="d-flex me-3" onSubmit={handleSearch}>
            <InputGroup>
              <Form.Control
                type="search"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <Button 
                variant="outline-primary" 
                type="submit"
                className="search-btn"
              >
                <i className="fas fa-search"></i>
              </Button>
            </InputGroup>
          </Form>

          {/* Auth Buttons */}
          <Nav>
            {isAuthenticated ? (
              <Dropdown align="end">
                <Dropdown.Toggle variant="link" className="user-dropdown-toggle">
                  <div className="user-info">
                    {user?.profile?.avatar ? (
                      <img 
                        src={user.profile.avatar} 
                        alt={user.name} 
                        className="user-avatar"
                      />
                    ) : (
                      <div className="user-avatar-placeholder">
                        <i className="fas fa-user"></i>
                      </div>
                    )}
                    <span className="user-name">{user?.name}</span>
                    <i className="fas fa-chevron-down ms-1"></i>
                  </div>
                </Dropdown.Toggle>

                <Dropdown.Menu className="user-dropdown-menu">
                  <Dropdown.Header>
                    <div className="dropdown-user-info">
                      <strong>{user?.name}</strong>
                      <small className="text-muted d-block">{user?.email}</small>
                      <span className="badge bg-primary mt-1">{user?.role}</span>
                    </div>
                  </Dropdown.Header>
                  <Dropdown.Divider />
                  <Dropdown.Item as={Link} to="/dashboard">
                    <i className="fas fa-tachometer-alt me-2"></i>
                    Dashboard
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/profile">
                    <i className="fas fa-user me-2"></i>
                    Profile
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/my-courses">
                    <i className="fas fa-book me-2"></i>
                    My Courses
                  </Dropdown.Item>
                  {user?.role === 'instructor' && (
                    <Dropdown.Item as={Link} to="/create-course">
                      <i className="fas fa-plus me-2"></i>
                      Create Course
                    </Dropdown.Item>
                  )}
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout} className="text-danger">
                    <i className="fas fa-sign-out-alt me-2"></i>
                    Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" className="nav-link-auth">
                  <Button variant="outline-primary" size="sm">
                    Login
                  </Button>
                </Nav.Link>
                <Nav.Link as={Link} to="/register" className="nav-link-auth">
                  <Button variant="primary" size="sm">
                    Sign Up
                  </Button>
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar; 