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

const salesQuery = () => {
  return `SELECT count(*) as 'sales', sum(cashAmount) + sum(creditCardAmount) + sum(debitCardAmount) + sum(creditAgreementAmount) + sum(easyPayAmount) + sum(flexecashAmount) + sum(giftCardAmount) + sum(giftVoucherAmount) + sum(invoiceAmount) as 'amount', latest(Latitude) as 'latitude', latest(Longitude) as 'longitude' FROM EclipseTransactionData JOIN (SELECT \`Currys Branch Number\` as costCenterCd, Latitude, Longitude FROM lookup(Stores)) ON costCenterCd FACET costCenterCd as 'storeNumber' LIMIT 1000`;
};

export const salesNrql = () => {
  return `nrql( query: "${salesQuery()}" ) { results }`;
};

export const nerdGraphSalesQuery = () => `
    query($id: Int!) {
      actor {
        account(id: $id) {
          sales: ${salesNrql()}
        }
      }
    }
`;
