import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { RouterProvider } from 'react-router-dom';
import defaultRouter from './routes';
import { Provider } from 'react-redux'
import { store } from './store/store';
import DynamicRouterWrapper from './routes/DynamicRouterWrapper';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <DynamicRouterWrapper />
  </Provider>
);


