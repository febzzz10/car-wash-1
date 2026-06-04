export function generateWhatsAppLink(booking, adminNumber) {
  const message = [
    "*New Car Wash Booking*",
    "",
    `*Name*: ${booking.name}`,
    `*Car*: ${booking.carMake} ${booking.carModel}`,
    `*Plate*: ${booking.carPlate || "N/A"}`,
    `*Service*: ${booking.service}`,
    `*Date*: ${booking.date}`,
    `*Time*: ${booking.time}`,
     `*Notes*: ${booking.notes || "None"}`,
    "",
    "Please confirm this booking.",
  ].join("\n");

  const encoded = encodeURIComponent(message);
  return `https://wa.me/${adminNumber}?text=${encoded}`;
}
