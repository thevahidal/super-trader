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


## Docs
There's a swagger doc available at [`http://localhost:8080/docs/`](http://localhost:8080/docs/), which you can see the APIs and run them at the same time. (Better) 

Also there's a postman collection in [`docs/`](docs/) directory.

## How to use this
Here's a sample scenario to use this project:
    
1. Register a new User. 

        /api/v1/auth/register/ [POST]

        {
            "email": "mark@example.com",
            "firstName": "Mark",
            "lastName": "Smith",
            "password": "strong@password" 
        }
    
    It will automatically set a token cookie for you. You'll be able to call private APIs from now on.

2. List all shares

        /api/v1/shares/ [GET]

    You'll see the shares. Let's buy some Apple share. Notice that it's symbol is APL.

3. Buy some Apple (APL)

        /api/v1/shares/APL/buy/ [POST]

        {
            "unit": 100,
            "portfolioId": 1 // This is optional, if you don't choose any portfolio, system will use your default one instead 
        }

    Alright now you bought some Apple shares. Now let's sell some of it. Take note of the id of your bought asset, we'll be using this for selling the asset.

4. Sell some of your Apple asset

        /api/v1/assets/1/sell/ [POST] ("1" here is the id your asset.)

        {
            "unit": 50,
        }

    Cool now you sold half of you Apple share! Alright Let's see your portfolios now!

5. List your portfolios

        /api/v1/portfolios/ [GET]

    Right now you only have you're default portfolio which was created for you as you registered. Take note of it's id, we're going to use to see how many assets you have in there!

6. List asset of your portfolio

        /api/v1/portfolios/1/asset/ [GET]  ("1" here is the id your portfolio.)

    Cool! You'll see that you have 50 shares of Apple! (Remember you sold half of Apple share, right?)

7. Let's buy some more Apple shares! Maybe 2 more times! (Step "3") x 2

8. Then lets see all our assets once more. You see that we have 3 apple assets! But we would like to see all our apple assets together! (Aggregated / Grouped) (Step "6")

9. Let's see the aggregated assets!

        /api/v1/portfolios/1/asset/?grouped=true [GET] 

    Awesome, now you see all you Apple share all grouped and together!

10. Alright now maybe you're thinking if I can see my Apple shares together, how can I sell them together?

        /api/v1/shares/APL/sell/ [POST]
        {
            "unit": 100,
        }

    So it sold some assets to cover your need 100 units!

0. Did your token get expired?

        /api/v1/auth/token/obtain/ [POST]

        {
            "email": "mark@example.com",
            "password": "strong@password" 
        }