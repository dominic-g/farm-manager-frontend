# Farm Management System (Frontend)

The React-based dashboard for the Farm Management System. Built with Mantine UI.

## 🛠 Setup

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Variables**
    Create a `.env` file in the root directory:

    ***This will require the farming erp plugin by [https://dominicn.dev/](Dominic_N)***
    
    ```env
    VITE_API_BASE_URL=http://your-wordpress-site/wp-json/wp/v2
    VITE_API_AUTH_URL=http://your-wordpress-site/wp-json/jwt-auth/v1
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```

4.  **Run Tests**
    We use **Vitest** for unit and component testing.
    ```bash
    npm run test
    ```

## 🏗 Stack
- **Framework:** React + TypeScript
- **Build Tool:** Vite
- **UI Library:** Mantine UI
- **State Management:** TanStack Query
- **Testing:** Vitest + React Testing Library