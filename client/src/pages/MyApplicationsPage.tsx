import React, { useEffect, useState } from 'react';
import { ApplicationService } from '../services/ApplicationService';
import { useAuth } from '../hooks/useAuth';
import { Card, Button, Badge, Spinner, Row, Col, Container, Accordion } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TeamMember {
  id: number;
  userId: number;
  email: string;
  fullName: string;
  is_capitan: boolean;
}

interface Team {
  id: number;
  name: string;
  description: string;
  members?: TeamMember[];
  Teammembers?: any[];
}

interface UserInfo {
  firstName: string;
  lastName: string;
  middleName?: string;
  phone: string;
}

interface User {
  id: number;
  email: string;
  role: string;
  user_info?: UserInfo;
  fullName?: string;
}

interface Competition {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface Application {
  id: number;
  UUID: string;
  UserId: number;
  TeamId: number;
  CompetitionId: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  User: User;
  Team: Team;
  Competition: Competition;
}

const MyApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchMyApplications();
  }, []);

  const fetchMyApplications = async () => {
    try {
      setLoading(true);
      const response = await ApplicationService.getMyApplications();
      setApplications(response.data);
      console.log('Мои заявки:', response.data);
    } catch (error) {
      console.error('Ошибка при получении заявок:', error);
      toast.error('Не удалось загрузить заявки');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning">На рассмотрении</Badge>;
      case 'approved':
        return <Badge bg="success">Одобрена</Badge>;
      case 'rejected':
        return <Badge bg="danger">Отклонена</Badge>;
      default:
        return <Badge bg="secondary">Неизвестно</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd.MM.yyyy', { locale: ru });
    } catch (e) {
      return 'Дата не указана';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Мои заявки на соревнования</h1>
        <Button 
          variant="primary" 
          onClick={fetchMyApplications}
        >
          Обновить
        </Button>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-5">
          <h4>У вас пока нет заявок на соревнования</h4>
          <p>Вы можете подать заявку на участие в разделе "Соревнования"</p>
        </div>
      ) : (
        applications.map((app) => (
          <Card key={app.id} className="mb-4">
            <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
              <div>
                {app.Competition?.name || 'Соревнование не указано'}
              </div>
              <div>{getStatusBadge(app.status)}</div>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h4>Информация о команде</h4>
                  <p><strong>Название команды:</strong> {app.Team?.name || 'Не указано'}</p>
                  <p><strong>Описание команды:</strong> {app.Team?.description || 'Не указано'}</p>
                  
                  {/* Проверяем наличие участников команды */}
                  {app.Team?.members && app.Team.members.length > 0 && (
                    <Accordion className="mt-3">
                      <Accordion.Item eventKey="0">
                        <Accordion.Header>Участники команды ({app.Team.members.length})</Accordion.Header>
                        <Accordion.Body>
                          <ul className="list-group">
                            {app.Team.members.map((member) => (
                              <li key={member.id} className="list-group-item d-flex justify-content-between align-items-center">
                                <div>
                                  <strong>{member.fullName || 'Имя не указано'}</strong>
                                  <div className="text-muted">{member.email}</div>
                                </div>
                                {member.is_capitan && (
                                  <Badge bg="primary">Капитан</Badge>
                                )}
                              </li>
                            ))}
                          </ul>
                        </Accordion.Body>
                      </Accordion.Item>
                    </Accordion>
                  )}

                  {/* Если участников нет в полях members, проверяем Teammembers */}
                  {!app.Team?.members && app.Team?.Teammembers && app.Team.Teammembers.length > 0 && (
                    <Accordion className="mt-3">
                      <Accordion.Item eventKey="0">
                        <Accordion.Header>Участники команды ({app.Team.Teammembers.length})</Accordion.Header>
                        <Accordion.Body>
                          <ul className="list-group">
                            {app.Team.Teammembers.map((member) => (
                              <li key={member.id} className="list-group-item d-flex justify-content-between align-items-center">
                                <div>
                                  {member.User?.user_info ? (
                                    <strong>
                                      {`${member.User.user_info.lastName || ''} ${member.User.user_info.firstName || ''} ${member.User.user_info.middleName || ''}`.trim() || 'Имя не указано'}
                                    </strong>
                                  ) : (
                                    <strong>Имя не указано</strong>
                                  )}
                                  <div className="text-muted">{member.User?.email || 'Email не указан'}</div>
                                </div>
                                {member.is_capitan && (
                                  <Badge bg="primary">Капитан</Badge>
                                )}
                              </li>
                            ))}
                          </ul>
                        </Accordion.Body>
                      </Accordion.Item>
                    </Accordion>
                  )}
                </Col>
                <Col md={6}>
                  <h4>Информация о соревновании</h4>
                  <p><strong>Название:</strong> {app.Competition?.name || 'Не указано'}</p>
                  <p><strong>Описание:</strong> {app.Competition?.description || 'Не указано'}</p>
                  <p><strong>Дата начала:</strong> {app.Competition?.startDate ? formatDate(app.Competition.startDate) : 'Не указано'}</p>
                  <p><strong>Дата окончания:</strong> {app.Competition?.endDate ? formatDate(app.Competition.endDate) : 'Не указано'}</p>
                  <p><strong>Статус соревнования:</strong> {app.Competition?.status || 'Не указано'}</p>
                  
                  <h4 className="mt-4">Статус заявки</h4>
                  <p><strong>Статус:</strong> {getStatusBadge(app.status)}</p>
                  <p><strong>Дата подачи:</strong> {formatDate(app.createdAt)}</p>
                </Col>
              </Row>
            </Card.Body>
            <Card.Footer className="d-flex justify-content-end">
              <Link to={`/applications/${app.id}`} className="btn btn-outline-primary me-2">
                Подробнее
              </Link>
              {app.status === 'pending' && (
                <Button 
                  variant="danger" 
                  onClick={async () => {
                    try {
                      await ApplicationService.deleteApplication(app.id);
                      toast.success('Заявка успешно отозвана');
                      fetchMyApplications();
                    } catch (error) {
                      console.error('Ошибка при отзыве заявки:', error);
                      toast.error('Не удалось отозвать заявку');
                    }
                  }}
                >
                  Отозвать заявку
                </Button>
              )}
            </Card.Footer>
          </Card>
        ))
      )}
    </Container>
  );
};

export default MyApplicationsPage; 