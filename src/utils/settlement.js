// Given a list of { user_id, name, net } balances (from the /balances endpoint),
// compute the minimum set of direct payments needed to settle everyone up.
//
// Approach: greedy debtor-creditor matching.
//   - Split people into "debtors" (net < 0, they owe money) and
//     "creditors" (net > 0, they are owed money).
//   - Repeatedly match the debtor who owes the most against the creditor
//     who is owed the most. Settle the smaller of the two amounts between
//     them, record that as one payment, and reduce both balances by it.
//   - Repeat until everyone's balance is ~0.
//
// This does not necessarily produce the mathematically optimal minimum
// number of transactions in every edge case, but it's the standard,
// easy-to-explain approach used by real expense-splitting apps, and it
// always produces a valid, non-redundant settlement.

function roundToCents(n) {
    return Math.round(n * 100) / 100;
  }
  
  function calculateSettlements(balances) {
    const EPSILON = 0.01; // ignore rounding dust below 1 paisa/cent
  
    // Work on copies so we don't mutate the caller's data
    const debtors = balances
      .filter((b) => b.net < -EPSILON)
      .map((b) => ({ user_id: b.user_id, name: b.name, amount: -b.net }))
      .sort((a, b) => b.amount - a.amount); // largest debt first
  
    const creditors = balances
      .filter((b) => b.net > EPSILON)
      .map((b) => ({ user_id: b.user_id, name: b.name, amount: b.net }))
      .sort((a, b) => b.amount - a.amount); // largest credit first
  
    const settlements = [];
  
    let i = 0; // pointer into debtors
    let j = 0; // pointer into creditors
  
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
  
      const paymentAmount = roundToCents(Math.min(debtor.amount, creditor.amount));
  
      if (paymentAmount > EPSILON) {
        settlements.push({
          from_user_id: debtor.user_id,
          from_name: debtor.name,
          to_user_id: creditor.user_id,
          to_name: creditor.name,
          amount: paymentAmount,
        });
      }
  
      debtor.amount = roundToCents(debtor.amount - paymentAmount);
      creditor.amount = roundToCents(creditor.amount - paymentAmount);
  
      if (debtor.amount <= EPSILON) i++;
      if (creditor.amount <= EPSILON) j++;
    }
  
    return settlements;
  }
  
  module.exports = { calculateSettlements };