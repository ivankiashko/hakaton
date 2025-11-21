import React from 'react'
import { User } from 'lucide-react'

export interface OwnerData {
  full_name: string
  passport_series: string
  passport_number: string
  passport_issued_by: string
  passport_issued_date: string
  phone: string
  email: string
  registration_address?: string
}

interface OwnerDataFormProps {
  data: OwnerData
  onChange: (data: OwnerData) => void
}

export const OwnerDataForm: React.FC<OwnerDataFormProps> = ({ data, onChange }) => {
  const handleChange = (field: keyof OwnerData, value: string) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Данные собственника</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ФИО полностью
          </label>
          <input
            type="text"
            value={data.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
            placeholder="Иванов Иван Иванович"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Серия паспорта
          </label>
          <input
            type="text"
            value={data.passport_series}
            onChange={(e) => handleChange('passport_series', e.target.value)}
            placeholder="1234"
            maxLength={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Номер паспорта
          </label>
          <input
            type="text"
            value={data.passport_number}
            onChange={(e) => handleChange('passport_number', e.target.value)}
            placeholder="567890"
            maxLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Кем выдан
          </label>
          <input
            type="text"
            value={data.passport_issued_by}
            onChange={(e) => handleChange('passport_issued_by', e.target.value)}
            placeholder="ТП №1 ОУФМС России по г. Москве"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Дата выдачи
          </label>
          <input
            type="text"
            value={data.passport_issued_date}
            onChange={(e) => handleChange('passport_issued_date', e.target.value)}
            placeholder="01.01.2010"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Телефон
          </label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+7 (900) 123-45-67"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="ivanov@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Адрес регистрации (опционально)
          </label>
          <input
            type="text"
            value={data.registration_address || ''}
            onChange={(e) => handleChange('registration_address', e.target.value)}
            placeholder="г. Москва, ул. Ленина, д. 1, кв. 1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  )
}

export interface ApartmentData {
  address: string
  apartment_number: string
  cadastral_number: string
  total_area: string
  building_year?: string
  building_series?: string
}

interface ApartmentDataFormProps {
  data: ApartmentData
  onChange: (data: ApartmentData) => void
}

export const ApartmentDataForm: React.FC<ApartmentDataFormProps> = ({ data, onChange }) => {
  const handleChange = (field: keyof ApartmentData, value: string) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold">Данные квартиры</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Адрес
          </label>
          <input
            type="text"
            value={data.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="г. Москва, ул. Ленина, д. 1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Номер квартиры
          </label>
          <input
            type="text"
            value={data.apartment_number}
            onChange={(e) => handleChange('apartment_number', e.target.value)}
            placeholder="123"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Площадь (м²)
          </label>
          <input
            type="text"
            value={data.total_area}
            onChange={(e) => handleChange('total_area', e.target.value)}
            placeholder="45.5"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Кадастровый номер
          </label>
          <input
            type="text"
            value={data.cadastral_number}
            onChange={(e) => handleChange('cadastral_number', e.target.value)}
            placeholder="77:01:0001001:1234"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Год постройки (опционально)
          </label>
          <input
            type="text"
            value={data.building_year || ''}
            onChange={(e) => handleChange('building_year', e.target.value)}
            placeholder="1975"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Серия дома (опционально)
          </label>
          <input
            type="text"
            value={data.building_series || ''}
            onChange={(e) => handleChange('building_series', e.target.value)}
            placeholder="П-44Т"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  )
}
