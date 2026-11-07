import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CurrencyContext = createContext(null);

export const CurrencyProvider = ({ children }) => {
  const { user } = useAuth();
  const [currency, setCurrency] = useState('₹');

  useEffect(() => {
    if (user?.currency) {
      setCurrency(user.currency);
    }
  }, [user]);

  const formatMoney = (amount) => {
    const num = Number(amount) || 0;
    return `${currency}${num.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatMoney }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
