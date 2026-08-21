// Shapes the payload sent to AddBooking / AddBookingHotel, mirroring what
// booking_chalet.dart / the buildings booking flow send from the app.
export class BookingEntity {
    constructor({
        buildingId,
        isChalet,
        dates = [],
        customerName = '',
        phone = '',
        acceptDeposit = false,
        flatId = null,
        insuranceAmount = 0,
    }) {
        this.buildingId = buildingId;
        this.isChalet = isChalet;
        this.dates = dates;
        this.customerName = customerName;
        this.phone = phone;
        this.acceptDeposit = acceptDeposit;
        this.flatId = flatId;
        this.insuranceAmount = insuranceAmount;
    }

    toApiPayload() {
        if (this.isChalet) {
            return {
                buildingId: this.buildingId,
                dates: this.dates,
                customerName: this.customerName,
                phone: this.phone,
                acceptDeposit: this.acceptDeposit,
            };
        }
        return {
            flatId: this.flatId,
            hotelbuildingID: this.buildingId,
            dates: this.dates,
            customerName: this.customerName,
            phone: this.phone,
            acceptDeposit: this.acceptDeposit,
        };
    }
}
