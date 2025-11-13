import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { shipments } from '../services/api';

const TRANSPORT_TYPES = [
  { value: 'EXPRESS_PARCEL', label: 'Экспресс-посылка' },
  { value: 'DIRECT_RAILWAY', label: 'Прямой ЖД' },
  { value: 'SEA_RAILWAY', label: 'Море + ЖД' },
  { value: 'ROAD_TRANSPORT', label: 'Автотранспорт' },
  { value: 'AIR_FREIGHT', label: 'Авиаперевозка' },
];

export default function CreateShipment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    readyForPickupDate: '',
    requiredDeliveryDate: '',
    bidsDeadline: '',
    incoterms: 'FOB',
    incotermsLocation: '',
    transportTypes: [] as string[],
    pickupAddress: '',
    deliveryAddress: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleTransportTypeChange = (value: string) => {
    if (formData.transportTypes.includes(value)) {
      setFormData({
        ...formData,
        transportTypes: formData.transportTypes.filter((t) => t !== value),
      });
    } else {
      setFormData({
        ...formData,
        transportTypes: [...formData.transportTypes, value],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await shipments.create(formData);
      navigate('/importer/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка при создании груза');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Создать новый груз</h1>
        <p className="mt-2 text-gray-600">Заполните информацию о грузе для сбора ставок</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="title" className="label">
            Название груза *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            className="input"
            value={formData.title}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="description" className="label">
            Описание
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="input"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="pickupAddress" className="label">
              Адрес забора *
            </label>
            <input
              type="text"
              id="pickupAddress"
              name="pickupAddress"
              required
              className="input"
              value={formData.pickupAddress}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="deliveryAddress" className="label">
              Адрес доставки *
            </label>
            <input
              type="text"
              id="deliveryAddress"
              name="deliveryAddress"
              required
              className="input"
              value={formData.deliveryAddress}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="incoterms" className="label">
              Инкотермс *
            </label>
            <select
              id="incoterms"
              name="incoterms"
              required
              className="input"
              value={formData.incoterms}
              onChange={handleChange}
            >
              <option value="EXW">EXW</option>
              <option value="FCA">FCA</option>
              <option value="CPT">CPT</option>
              <option value="CIP">CIP</option>
              <option value="DAP">DAP</option>
              <option value="DPU">DPU</option>
              <option value="DDP">DDP</option>
              <option value="FAS">FAS</option>
              <option value="FOB">FOB</option>
              <option value="CFR">CFR</option>
              <option value="CIF">CIF</option>
            </select>
          </div>

          <div>
            <label htmlFor="incotermsLocation" className="label">
              Место применения Инкотермс *
            </label>
            <input
              type="text"
              id="incotermsLocation"
              name="incotermsLocation"
              required
              className="input"
              value={formData.incotermsLocation}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label className="label">Виды транспорта *</label>
          <div className="space-y-2 mt-2">
            {TRANSPORT_TYPES.map((type) => (
              <label key={type.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.transportTypes.includes(type.value)}
                  onChange={() => handleTransportTypeChange(type.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="readyForPickupDate" className="label">
              Дата готовности к забору *
            </label>
            <input
              type="datetime-local"
              id="readyForPickupDate"
              name="readyForPickupDate"
              required
              className="input"
              value={formData.readyForPickupDate}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="requiredDeliveryDate" className="label">
              Требуемая дата доставки *
            </label>
            <input
              type="datetime-local"
              id="requiredDeliveryDate"
              name="requiredDeliveryDate"
              required
              className="input"
              value={formData.requiredDeliveryDate}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="bidsDeadline" className="label">
              Дедлайн подачи ставок *
            </label>
            <input
              type="datetime-local"
              id="bidsDeadline"
              name="bidsDeadline"
              required
              className="input"
              value={formData.bidsDeadline}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/importer/dashboard')}
            className="btn btn-secondary"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={loading || formData.transportTypes.length === 0}
            className="btn btn-primary"
          >
            {loading ? 'Создание...' : 'Создать груз'}
          </button>
        </div>
      </form>
    </div>
  );
}
