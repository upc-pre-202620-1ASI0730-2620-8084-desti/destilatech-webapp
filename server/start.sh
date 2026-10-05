npx json-server --watch db.json --routes routes.json --middlewares authentication.middleware.cjs stripe-checkout.middleware.cjs --host "${HOST:-localhost}" --port "${PORT:-3000}"
