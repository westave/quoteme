import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { users, shipments } from '../services/api';
import type { User, Shipment } from '../types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function ImporterDashboard() {
  const [pendingForwarders, setPendingForwarders] = useState<User[]>([]);
  const [myShipments, setMyShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'shipments' | 'forwarders'>('shipments');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [forwardersRes, shipmentsRes] = await Promise.all([
        users.getPendingForwarders(),
        shipments.getAll(),
      ]);
      setPendingForwarders(forwardersRes.data.forwarders);
      setMyShipments(shipmentsRes.data.shipments);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveForwarder = async (id: string) => {
    try {
      await users.updateForwarderStatus(id, 'ACTIVE');
      await loadData();
    } catch (error) {
      console.error('Error approving forwarder:', error);
    }
  };

  const handleRejectForwarder = async (id: string) => {
    try {
      await users.updateForwarderStatus(id, 'REJECTED');
      await loadData();
    } catch (error) {
      console.error('Error rejecting forwarder:', error);
    }
  };

  const handleCloseShipment = async (id: string) => {
    if (!confirm('Вы уверены, что хотите закрыть груз? Все ставки станут видны всем участникам.')) {
      return;
    }

    try {
      await shipments.close(id);
      await loadData();
    } catch (error) {
      console.error('Error closing shipment:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Панель импортера</h1>
        <p className="mt-2 text-gray-600">Управление грузами и экспедиторами</p>
      </div>

      {pendingForwarders.length > 0 && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                У вас {pendingForwarders.length} экспедитор(ов) ожидают активации
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('shipments')}
            className={`${
              activeTab === 'shipments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Мои грузы ({myShipments.length})
          </button>
          <button
            onClick={() => setActiveTab('forwarders')}
            className={`${
              activeTab === 'forwarders'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Экспедиторы
            {pendingForwarders.length > 0 && (
              <span className="ml-2 bg-yellow-100 text-yellow-800 py-0.5 px-2 rounded-full text-xs">
                {pendingForwarders.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {activeTab === 'shipments' ? (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Список грузов</h2>
            <Link to="/importer/shipments/new" className="btn btn-primary">
              + Создать груз
            </Link>
          </div>

          {myShipments.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500 mb-4">У вас пока нет грузов</p>
              <Link to="/importer/shipments/new" className="btn btn-primary">
                Создать первый груз
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myShipments.map((shipment) => (
                <div key={shipment.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold">{shipment.title}</h3>
                        <span className={`badge ${shipment.status === 'OPEN' ? 'badge-open' : 'badge-closed'}`}>
                          {shipment.status === 'OPEN' ? 'Открыт' : 'Закрыт'}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        <p>📦 {shipment.pickupAddress} → {shipment.deliveryAddress}</p>
                        <p>📅 Дедлайн ставок: {format(new Date(shipment.bidsDeadline), 'dd MMM yyyy, HH:mm', { locale: ru })}</p>
                        <p>💼 Ставок: {shipment._count?.bids || 0}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/importer/shipments/${shipment.id}`}
                        className="btn btn-secondary"
                      >
                        Просмотр
                      </Link>
                      {shipment.status === 'OPEN' && (
                        <button
                          onClick={() => handleCloseShipment(shipment.id)}
                          className="btn btn-success"
                        >
                          Закрыть
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-6">Управление экспедиторами</h2>

          {pendingForwarders.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500">Нет экспедиторов, ожидающих активации</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingForwarders.map((forwarder) => (
                <div key={forwarder.id} className="card">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">{forwarder.companyName}</h3>
                      <p className="text-sm text-gray-600">ИНН: {forwarder.inn}</p>
                      <p className="text-sm text-gray-600">Email: {forwarder.email}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApproveForwarder(forwarder.id)}
                        className="btn btn-success"
                      >
                        Одобрить
                      </button>
                      <button
                        onClick={() => handleRejectForwarder(forwarder.id)}
                        className="btn btn-danger"
                      >
                        Отклонить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
