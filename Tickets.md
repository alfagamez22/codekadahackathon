Application Gas/Oil prices tracker
This application will track the prices of gas and oil, and provide users with up-to-date information on the current prices. The application will also allow users to set price alerts, so they can be notified when the prices reach a certain level. Additionally, the application will provide historical data on gas and oil prices, allowing users to analyze trends and make informed decisions about their fuel purchases.
- Users are also allowed to verify the prices of gas and oil in different locations.
- The application will use Google Maps API to calculate the distance between the user and destination and provide the estimated fuel cost for the trip based on current gas prices.
- The application will suggest the best travel routes and times to avoid traffic and save fuel.

### Feature 1:
- Real-time price tracking: The application will provide users with real-time updates on gas and oil prices, allowing them to stay informed about the current market conditions.
- Users can crowdsource price information by submitting the prices they find at local gas stations.
- Users can also view price trends over time.

### Feature 2: Scrape oil prices from various sources
- Make use of playwright, and automate all the commands to to scrape oil prices from various sources such as news websites, financial websites, and government websites with playwright-cli.
- The application will use the scraped data to provide users with accurate and up-to-date information on oil prices.
- Sample Template is Feature2.md, contents of the endpoint of gaswatchph.com/js/data.js?v=20260505a can be used as a reference for the data structure and evaluation.

### Feature 3: Google Maps Integration
- User can provide destination and the application will calculate the estimated fuel cost for the trip based on current gas prices of chosen fuel type and company.
- The application suggest the best time to travel based on traffic data.
- EstimatedFuelCost = (Distance / VehicleFuelEfficiency) * CurrentGasPrice