export default function RentalSafety() {
  return (
    <section className='rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-brand-800'>
      <h2 className='text-2xl font-bold'>Rent safely</h2>
      <ul className='my-4 list-disc space-y-2 pl-5'>
        <li>View the property and check who is authorised to let it before sending a deposit.</li>
        <li>Pause if someone pressures you to pay or asks you to move off-platform.</li>
        <li>Keep messages and payment records. Contact your bank promptly if you sent money to a suspected scammer.</li>
      </ul>
      <a href='https://www.garda.ie/en/crime/fraud/' className='font-semibold underline'>How to report suspected rental fraud</a>
    </section>
  );
}
