import { Outlet } from 'react-router-dom';
import { CollegeNotificationsProvider } from '../../context/CollegeNotificationsContext';

/** Wraps college dashboard routes so notifications load once for the portal shell. */
export function CollegeNotificationsRoute() {
  return (
    <CollegeNotificationsProvider>
      <Outlet />
    </CollegeNotificationsProvider>
  );
}
