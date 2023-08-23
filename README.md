# EDGAR-API
An API that interfaces with the SEC's API 

## Data Source
All data is fetched from the SEC's [EDGAR API](https://www.sec.gov/edgar/sec-api-documentation). This API does not
check for or guarantee the accuracy of the data.

## Usage

```typescript
import Driver, {CIK} from 'edgar-api';

const driver = new Driver();

const cik = new CIK('0000320193');

const submissions = await driver.submissions(cik);

const recentFilings = submissions.recent.filings;

const filing = await driver.filing(cik, recent.accessionNumber[0],
    recent.primaryDocument[0]);

const cash = filing.getFact("us-gaap:CashAndCashEquivalentsAtCarryingValue");

console.log(cash.value);
```

## User Agent
The SEC requires that you provide a user agent when making requests to their API. You can do this by setting the
`USER_AGENT` environment variable. You can also pass the user agent as an argument to the `Driver` constructor. 

## 
