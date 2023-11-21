// const lookupTableQuery = () => {
//   return `FROM lookup(Stores) SELECT *`;
// };

// export const lookupTableNrql = () => {
//   return `nrql( query: "${lookupTableQuery()}" ) { results }`;
// };

// export const nerdGraphLookupQuery = () => `
//     query($id: Int!) {
//       actor {
//         account(id: $id) {
//           lookup: ${lookupTableNrql()}
//         }
//       }
//     }
// `;

const salesQuery = (timeRange) => {
  let query = `SELECT count(*) as 'sales', sum(cashAmount) + sum(creditCardAmount) + sum(debitCardAmount) + sum(creditAgreementAmount) + sum(easyPayAmount) + sum(flexecashAmount) + sum(giftCardAmount) + sum(giftVoucherAmount) + sum(invoiceAmount) as 'amount', latest(Latitude) as 'latitude', latest(Longitude) as 'longitude' FROM EclipseTransactionData JOIN (SELECT \`Currys Branch Number\` as costCenterCd, Latitude, Longitude FROM lookup(Stores)) ON costCenterCd FACET costCenterCd as 'storeNumber' LIMIT 1000`;

  if (timeRange) {
    if (timeRange.begin_time) {
      query += ` SINCE ${timeRange.begin_time}`;
    }
    if (timeRange.end_time) {
      query += ` UNTIL ${timeRange.end_time}`;
    }
    if (timeRange.duration) {
      query += ` SINCE ${timeRange.duration}`;
    }
  }

  return query;
};

export const salesNrql = (timeRange) => {
  return `nrql( query: "${salesQuery(timeRange)}" ) { results }`;
};

export const nerdGraphSalesQuery = (timeRange) => `
    query($id: Int!) {
      actor {
        account(id: $id) {
          sales: ${salesNrql(timeRange)}
        }
      }
    }
`;
