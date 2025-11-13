import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shipments, bids } from '../services/api';
import { useAuthStore } from '../context/authStore';
import type { Shipment, Bid } from '../types';
import { format, isPast } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function ShipmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidFormData, setBidFormData] = useState({
    costsBeforeBorder: 0,
    costsBeforeBorderVat: 20,
    costsAfterBorder: 0,
    costsAfterBorderVat: 20,
    localCosts: 0,
    localCostsVat: 20,
    transportType: '',
    notes: '',
  });

  useEffect(() => {
    loadShipment();
  }, [id]);

  const loadShipment = async () => {
    if (!id) return;
    try {
      const response = await shipments.getById(id);
      setShipment(response.data.shipment);
      if (response.data.shipment.transportTypes.length > 0) {
        setBidFormData((prev) => ({
          ...prev,
          transportType: response.data.shipment.transportTypes[0],
        }));
      }
    } catch (error) {
      console.error('Error loading shipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBidFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    setBidFormData({
      ...bidFormData,
      [e.target.name]: value,
    });
  };

  const calculateTotal = () => {
    const total =
      bidFormData.costsBeforeBorder * (1 + bidFormData.costsBeforeBorderVat / 100) +
      bidFormData.costsAfterBorder * (1 + bidFormData.costsAfterBorderVat / 100) +
      bidFormData.localCosts * (1 + bidFormData.localCostsVat / 100);
    return total.toFixed(2);
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      await bids.create({
        ...bidFormData,
        shipmentId: id,
      });
      setShowBidForm(false);
      await loadShipment();
      alert('Ставка успешно подана!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ошибка при подаче ставки');
    }
  };

  const handleCloseShipment = async () => {
    if (!id) return;
    if (!confirm('Вы уверены, что хотите закрыть груз? Все ставки станут видны всем участникам.')) {
      return;
    }

    try {
      await shipments.close(id);
      await loadShipment();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ошибка при закрытии груза');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Загрузка...</div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card text-center">
          <p className="text-gray-500">Груз не найден</p>
        </div>
      </div>
    );
  }

  const isForwarder = user?.role === 'FORWARDER';
  const isImporter = user?.role === 'IMPORTER';
  const deadlinePassed = isPast(new Date(shipment.bidsDeadline));
  const canBid = isForwarder && shipment.status === 'OPEN' && !deadlinePassed;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="text-blue-600 hover:text-blue-800 mb-4">
          ← Назад
        </button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{shipment.title}</h1>
            <span className={`mt-2 inline-block badge ${shipment.status === 'OPEN' ? 'badge-open' : 'badge-closed'}`}>
              {shipment.status === 'OPEN' ? 'Открыт' : 'Закрыт'}
            </span>
          </div>
          {isImporter && shipment.status === 'OPEN' && (
            <button onClick={handleCloseShipment} className="btn btn-success">
              Закрыть груз
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Детали груза</h2>

            {shipment.description && (
              <div className="mb-4">
                <p className="text-gray-600">{shipment.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Маршрут</h3>
                <p className="text-sm text-gray-600">
                  <strong>Забор:</strong> {shipment.pickupAddress}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Доставка:</strong> {shipment.deliveryAddress}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-2">Инкотермс</h3>
                <p className="text-sm text-gray-600">
                  {shipment.incoterms} ({shipment.incotermsLocation})
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-2">Даты</h3>
                <p className="text-sm text-gray-600">
                  <strong>Готовность:</strong>{' '}
                  {format(new Date(shipment.readyForPickupDate), 'dd MMM yyyy', { locale: ru })}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Доставка:</strong>{' '}
                  {format(new Date(shipment.requiredDeliveryDate), 'dd MMM yyyy', { locale: ru })}
                </p>
                <p className={`text-sm ${deadlinePassed ? 'text-red-600' : 'text-gray-600'}`}>
                  <strong>Дедлайн ставок:</strong>{' '}
                  {format(new Date(shipment.bidsDeadline), 'dd MMM yyyy, HH:mm', { locale: ru })}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-2">Виды транспорта</h3>
                <div className="flex flex-wrap gap-1">
                  {shipment.transportTypes.map((type) => (
                    <span key={type} className="badge bg-blue-50 text-blue-700 text-xs">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {canBid && (
            <div className="card">
              <button
                onClick={() => setShowBidForm(!showBidForm)}
                className="w-full btn btn-primary mb-4"
              >
                {showBidForm ? 'Скрыть форму' : '+ Подать ставку'}
              </button>

              {showBidForm && (
                <form onSubmit={handleSubmitBid} className="space-y-4">
                  <div>
                    <label className="label">Вид транспорта</label>
                    <select
                      name="transportType"
                      required
                      className="input"
                      value={bidFormData.transportType}
                      onChange={handleBidFormChange}
                    >
                      {shipment.transportTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Расходы до границы РФ</label>
                      <input
                        type="number"
                        name="costsBeforeBorder"
                        required
                        step="0.01"
                        className="input"
                        value={bidFormData.costsBeforeBorder}
                        onChange={handleBidFormChange}
                      />
                    </div>
                    <div>
                      <label className="label">НДС (%)</label>
                      <input
                        type="number"
                        name="costsBeforeBorderVat"
                        required
                        step="0.01"
                        className="input"
                        value={bidFormData.costsBeforeBorderVat}
                        onChange={handleBidFormChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Расходы после границы РФ</label>
                      <input
                        type="number"
                        name="costsAfterBorder"
                        required
                        step="0.01"
                        className="input"
                        value={bidFormData.costsAfterBorder}
                        onChange={handleBidFormChange}
                      />
                    </div>
                    <div>
                      <label className="label">НДС (%)</label>
                      <input
                        type="number"
                        name="costsAfterBorderVat"
                        required
                        step="0.01"
                        className="input"
                        value={bidFormData.costsAfterBorderVat}
                        onChange={handleBidFormChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Локальные расходы</label>
                      <input
                        type="number"
                        name="localCosts"
                        required
                        step="0.01"
                        className="input"
                        value={bidFormData.localCosts}
                        onChange={handleBidFormChange}
                      />
                    </div>
                    <div>
                      <label className="label">НДС (%)</label>
                      <input
                        type="number"
                        name="localCostsVat"
                        required
                        step="0.01"
                        className="input"
                        value={bidFormData.localCostsVat}
                        onChange={handleBidFormChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Примечания (опционально)</label>
                    <textarea
                      name="notes"
                      rows={3}
                      className="input"
                      value={bidFormData.notes}
                      onChange={handleBidFormChange}
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-lg font-semibold text-gray-900">
                      Итого с НДС: {calculateTotal()} руб
                    </p>
                  </div>

                  <button type="submit" className="w-full btn btn-primary">
                    Подать ставку
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">
              Ставки ({shipment.bids?.length || 0})
            </h2>

            {!shipment.bids || shipment.bids.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Пока нет ставок</p>
            ) : (
              <div className="space-y-3">
                {shipment.bids
                  .sort((a, b) => a.totalCost - b.totalCost)
                  .map((bid, index) => (
                    <div
                      key={bid.id}
                      className={`p-4 rounded-lg border-2 ${
                        index === 0 ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">
                            {shipment.status === 'CLOSED' || bid.forwarderId === user?.id
                              ? bid.forwarder?.companyName
                              : bid.forwarder?.companyName || 'Анонимно'}
                          </p>
                          <p className="text-xs text-gray-500">{bid.transportType}</p>
                        </div>
                        {index === 0 && (
                          <span className="text-xs font-semibold text-green-700">Лучшая</span>
                        )}
                      </div>

                      <p className="text-lg font-bold text-gray-900">
                        {shipment.status === 'CLOSED' || bid.forwarderId === user?.id
                          ? `${bid.totalCost.toFixed(2)} руб`
                          : '●●●●● руб'}
                      </p>

                      {(shipment.status === 'CLOSED' || bid.forwarderId === user?.id) && (
                        <div className="mt-2 text-xs text-gray-600 space-y-1">
                          <p>До границы: {bid.costsBeforeBorder} + {bid.costsBeforeBorderVat}% НДС</p>
                          <p>После границы: {bid.costsAfterBorder} + {bid.costsAfterBorderVat}% НДС</p>
                          <p>Локальные: {bid.localCosts} + {bid.localCostsVat}% НДС</p>
                          {bid.notes && <p className="mt-2 italic">"{bid.notes}"</p>}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
