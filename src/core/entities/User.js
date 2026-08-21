export class UserEntity {
    constructor(raw = {}) {
        this.id = raw.id ?? 0;
        this.firstName = raw.firstName ?? '';
        this.lastName = raw.lastName ?? '';
        this.fullName = `${this.firstName} ${this.lastName}`.trim();
        this.email = raw.email ?? '';
        this.phone = raw.phoneNumber ?? raw.phone ?? '';
        this.raw = raw;
    }
}
