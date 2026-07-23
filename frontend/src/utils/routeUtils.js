// Utility functions for routing based on user role

export const getHomeRoute = (role) => {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'STAFF':
      return '/admin/dashboard';
    case 'CUSTOMER':
      return '/';
    default:
      return '/login';
  }
};

export const getLoginRoute = () => '/login';

export const getNotFoundRoute = (role) => {
  switch (role) {
    case 'ADMIN':
    case 'STAFF':
      return '/admin/dashboard';
    case 'CUSTOMER':
      return '/';
    default:
      return '/login';
  }
};
