import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { shipments } from '../services/api';
import type { Shipment } from '../types';
import { format, isPast } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function ForwarderDashboard() {
  const [availableShipments, setAvailableShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShipments();
  }, []);

  const loadShipments = async () => {
    try {
      const response = await shipments.getAll('OPEN');
      setAvailableShipments(response.data.shipments);
    } catch (error) {
      console.error('Error loading shipments:', error);
    } finally {
      setLoading(false);
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
        <h1 className="text-3xl font-bold text-gray-900">Панель экспедитора</h1>
        <p className="mt-2 text-gray-600">Доступные грузы для подачи ставок</p>
      </div>

      {availableShipments.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">Нет доступных грузов для подачи ставок</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {availableShipments.map((shipment) => {
            const deadlinePassed = isPast(new Date(shipment.bidsDeadline));

            return (
              <div key={shipment.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-xl font-semibold">{shipment.title}</h3>
                      {deadlinePassed ? (
                        <span className="badge bg-red-100 text-red-800">
                          Дедлайн истек
                        </span>
                      ) : (
                        <span className="badge badge-open">Открыт</span>
                      )}
                    </div>

                    {shipment.description && (
                      <p className="text-gray-600 mb-3">{shipment.description}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium text-gray-700">Маршрут:</span>
                          <p className="text-gray-600">
                            📦 {shipment.pickupAddress}
                            <br />
                            📍 {shipment.deliveryAddress}
                          </p>
                        </div>

                        <div>
                          <span className="font-medium text-gray-700">Инкотермс:</span>
                          <p className="text-gray-600">
                            {shipment.incoterms} ({shipment.incotermsLocation})
                          </p>
                        </div>

                        <div>
                          <span className="font-medium text-gray-700">Виды транспорта:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {shipment.transportTypes.map((type) => (
                              <span key={type} className="badge bg-blue-50 text-blue-700 text-xs">
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <span className="font-medium text-gray-700">Готовность к забору:</span>
                          <p className="text-gray-600">
                            {format(new Date(shipment.readyForPickupDate), 'dd MMM yyyy', { locale: ru })}
                          </p>
                        </div>

                        <div>
                          <span className="font-medium text-gray-700">Требуемая доставка:</span>
                          <p className="text-gray-600">
                            {format(new Date(shipment.requiredDeliveryDate), 'dd MMM yyyy', { locale: ru })}
                          </p>
                        </div>

                        <div>
                          <span className="font-medium text-gray-700">Дедлайн ставок:</span>
                          <p className={`${deadlinePassed ? 'text-red-600' : 'text-gray-600'}`}>
                            {format(new Date(shipment.bidsDeadline), 'dd MMM yyyy, HH:mm', { locale: ru })}
                          </p>
                        </div>

                        <div>
                          <span className="font-medium text-gray-700">Конкурентов:</span>
                          <p className="text-gray-600">{shipment._count?.bids || 0} ставок</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ml-6">
                    <Link
                      to={`/forwarder/shipments/${shipment.id}`}
                      className="btn btn-primary"
                    >
                      {deadlinePassed ? 'Просмотр' : 'Подать ставку'}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
