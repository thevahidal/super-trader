# Super Trader RESTful API
A simple backend for Super Traders game.

## Getting started
### 1. Clone and install dependencies
Clone this repository:
```
git clone git@github.com:thevahidal/super-traders.git
```

Install npm dependencies:
```
cd super-traders
npm install
```

### 3. Create environment variables
There's a sample env file which you can duplicate and rename it to `.env`,
and then update the variables:

```
cp .env.sample .env
nano .env
```

When `npx prisma migrate dev` is executed against a newly created database, seeding is also triggered. The seed file in [`prisma/seed.ts`](./prisma/seed.ts) will be executed and your database will be populated with the sample data.


### 3. Create and seed the database
Run the following command to create your database file:

```
npx prisma migrate dev --name init
```

When `npx prisma migrate dev` is executed against a newly created database, seeding is also triggered. The seed file in [`prisma/seed.ts`](./prisma/seed.ts) will be executed and your database will be populated with the sample data.


### 4. Start the REST API server
```
npm run dev
```

The server is now running on `http://localhost:8080`. You can now call the API requests, e.g. [`http://localhost:8080/api/v1/timestamp/`](http://localhost:8080/api/v1/timestamp/).
