# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

wx-stock is a Rust-based inventory management system for 五星(天津)石油装备有限公司 (Five-Star Tianjin Petroleum Equipment Co., Ltd). It combines a Rust Actix-web backend with vanilla JavaScript frontend to manage product inventory, categories, shopping cart, and orders.

## Common Commands

### Development
```bash
# Run development server (builds frontend + starts Rust server)
./run.sh

# Build frontend assets only
./scripts/build.sh

# Build frontend in watch mode
./scripts/build.sh --watch

# Force rebuild all frontend assets
./scripts/build.sh --force
```

### Production
```bash
# Production build (cross-compile for FreeBSD)
./build.sh
```

## Architecture

### Backend Structure
- **main.rs**: Actix-web server setup with PostgreSQL connection pool and authentication
- **html.rs**: HTML route handlers and static file serving
- **product.rs**: Product management, inventory statistics, filtering, and Excel export
- **cart.rs**: Shopping cart operations (add, remove, update, submit order)
- **orders.rs**: Order management and pending order tracking
- **tree.rs**: Category tree management with autocomplete functionality
- **user_set.rs**: User authentication, password changes, session management
- **service.rs**: Database utilities, Excel generation, translation services
- **information.rs**: Information query handlers

### Frontend Structure
- **assets/js/**: JavaScript source code organized by components and pages
  - **parts/**: Reusable components (table, modal, tree, cart, etc.)
  - **pages/**: Page-specific scripts (login, productset, cartpage, etc.)
- **scss/**: SASS stylesheets organized by base, pages, and components
- **static/**: Compiled JavaScript and CSS (auto-generated, do not modify)
- **templates/**: Ructe HTML templates with Rust embedding

### Key Patterns
- Uses ructe for compile-time HTML templates with Rust expressions
- Custom incremental build system for frontend assets (JavaScript minification with terser, SASS compilation)
- PostgreSQL with deadpool connection pooling
- Cookie-based authentication with 30-day expiry
- Modular JavaScript component system with custom table, modal, and tree components

### Database
- PostgreSQL database named "sales" shared with company ERP system
- Environment variables for database configuration (PG__HOST, PG__PORT, etc.)

## Development Notes

### Local Development Setup
1. Comment out the first two lines in assets/js/pages/login.js for auto-login:
   ```javascript
   setCookie("wxok", "ok", 3);
   localStorage.setItem('language', 'zh');
   ```
2. Ensure PostgreSQL is running and database `sales` exists
3. Set up environment variables in `.env` file

### Frontend Development
- Use `./scripts/build.sh --watch` for live frontend development
- The build system intelligently detects file changes and only rebuilds modified assets
- JavaScript files are minified using terser
- SASS files are compiled and compressed using dart-sass

### Production Deployment
- Cross-compiles to FreeBSD for production deployment
- Builds and deploys to remote server automatically via build.sh script

### API Routes
All routes are scoped under `/stock/` prefix:
- Main pages: `/`, `/login`, `/user_set`, `/cart`, `/myorders`
- Product operations: `/fetch_product`, `/fetch_statistic`, `/fetch_filter_items`
- Cart operations: `/add_to_cart`, `/get_cart_*`, `/remove_from_cart`, `/submit_order`
- Tree operations: `/tree`, `/tree_auto`
- User operations: `/login`, `/logout`, `/change_pass`
- Orders: `/get_user_orders`, `/get_order_details`, `/get_pending_orders_count`

### Key Technologies
- Rust 1.70+ with Actix-web 4.7
- PostgreSQL with deadpool-postgres connection pooling
- ructe for compile-time HTML templates
- SASS for CSS preprocessing
- terser for JavaScript minification
- rust_xlsxwriter for Excel export functionality
- chrono for datetime handling
- reqwest for HTTP client operations