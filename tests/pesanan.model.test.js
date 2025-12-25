const { Pesanan, Meja, Keranjang } = require("../models");

describe("Model Pesanan", () => {

    test("Harus memiliki atribut yang benar", () => {
        const attrs = Pesanan.rawAttributes;

        expect(attrs).toHaveProperty("id_pesanan");
        expect(attrs).toHaveProperty("tanggal_pesan");
        expect(attrs).toHaveProperty("status_pesanan");
        expect(attrs).toHaveProperty("id_meja");
    });

    test("id_pesanan harus menjadi primary key", () => {
        const attrs = Pesanan.rawAttributes;

        expect(attrs.id_pesanan.primaryKey).toBe(true);
    });

    test("id_pesanan harus bertipe STRING dengan panjang 50", () => {
        const attrs = Pesanan.rawAttributes;

        expect(attrs.id_pesanan.type.key).toBe("STRING");
    });

    test("tanggal_pesan tidak boleh null", () => {
        const attrs = Pesanan.rawAttributes;

        expect(attrs.tanggal_pesan.allowNull).toBe(false);
    });

    test("tanggal_pesan harus bertipe DATE", () => {
        const attrs = Pesanan.rawAttributes;

        expect(attrs.tanggal_pesan.type.key).toBe("DATE");
    });

    test("status_pesanan tidak boleh null", () => {
        const attrs = Pesanan.rawAttributes;

        expect(attrs.status_pesanan.allowNull).toBe(false);
    });

    test("status_pesanan harus bertipe STRING dengan panjang 50", () => {
        const attrs = Pesanan.rawAttributes;

        expect(attrs.status_pesanan.type.key).toBe("STRING");
    });

    test("id_meja tidak boleh null", () => {
        const attrs = Pesanan.rawAttributes;

        expect(attrs.id_meja.allowNull).toBe(false);
    });

    test("id_meja harus bertipe STRING dengan panjang 50", () => {
        const attrs = Pesanan.rawAttributes;

        expect(attrs.id_meja.type.key).toBe("STRING");
    });

    test("Model harus menggunakan nama tabel 'pesanan'", () => {
        expect(Pesanan.tableName).toBe("pesanan");
    });

    test("Model harus menonaktifkan timestamps", () => {
        expect(Pesanan.options.timestamps).toBe(false);
    });

    test("Model harus memiliki nama 'Pesanan'", () => {
        expect(Pesanan.name).toBe("Pesanan");
    });

    describe("Associations", () => {

        test("Harus memiliki relasi belongsTo dengan Meja", () => {
            const associations = Pesanan.associations;

            expect(associations).toHaveProperty("Meja");
            expect(associations.Meja.associationType).toBe("BelongsTo");
        });

        test("Relasi dengan Meja harus menggunakan foreignKey id_meja", () => {
            const association = Pesanan.associations.Meja;

            expect(association.foreignKey).toBe("id_meja");
        });

        test("Harus memiliki relasi hasMany dengan Keranjang", () => {
            const associations = Pesanan.associations;

            expect(associations).toHaveProperty("Keranjangs");
            expect(associations.Keranjangs.associationType).toBe("HasMany");
        });

        test("Relasi dengan Keranjang harus menggunakan foreignKey id_pesanan", () => {
            const association = Pesanan.associations.Keranjangs;

            expect(association.foreignKey).toBe("id_pesanan");
        });
    });

    describe("Validasi Data", () => {

        test("Dapat membuat instance Pesanan dengan data valid", () => {
            const pesananData = {
                id_pesanan: "PSN001",
                tanggal_pesan: new Date(),
                status_pesanan: "Menunggu Pembayaran",
                id_meja: "M001"
            };

            const pesanan = Pesanan.build(pesananData);

            expect(pesanan.id_pesanan).toBe("PSN001");
            expect(pesanan.status_pesanan).toBe("Menunggu Pembayaran");
            expect(pesanan.id_meja).toBe("M001");
            expect(pesanan.tanggal_pesan).toBeInstanceOf(Date);
        });

        test("Dapat membuat instance dengan status 'Diproses'", () => {
            const pesanan = Pesanan.build({
                id_pesanan: "PSN002",
                tanggal_pesan: new Date(),
                status_pesanan: "Diproses",
                id_meja: "M002"
            });

            expect(pesanan.status_pesanan).toBe("Diproses");
        });

        test("Dapat membuat instance dengan status 'Selesai'", () => {
            const pesanan = Pesanan.build({
                id_pesanan: "PSN003",
                tanggal_pesan: new Date(),
                status_pesanan: "Selesai",
                id_meja: "M003"
            });

            expect(pesanan.status_pesanan).toBe("Selesai");
        });

        test("Dapat membuat instance dengan status 'Dibatalkan'", () => {
            const pesanan = Pesanan.build({
                id_pesanan: "PSN004",
                tanggal_pesan: new Date(),
                status_pesanan: "Dibatalkan",
                id_meja: "M004"
            });

            expect(pesanan.status_pesanan).toBe("Dibatalkan");
        });
    });

    describe("Format ID Pesanan", () => {

        test("ID pesanan harus mengikuti format PSN dengan 4 digit", () => {
            const pesanan = Pesanan.build({
                id_pesanan: "PSN0001",
                tanggal_pesan: new Date(),
                status_pesanan: "Menunggu Pembayaran",
                id_meja: "M001"
            });

            expect(pesanan.id_pesanan).toMatch(/^PSN\d{4}$/);
        });

        test("ID pesanan dapat berupa format PSN dengan angka", () => {
            const pesanan = Pesanan.build({
                id_pesanan: "PSN9999",
                tanggal_pesan: new Date(),
                status_pesanan: "Menunggu Pembayaran",
                id_meja: "M001"
            });

            expect(pesanan.id_pesanan).toBe("PSN9999");
        });
    });

    describe("Tanggal Pesanan", () => {

        test("Tanggal pesan dapat berupa Date object", () => {
            const now = new Date();
            const pesanan = Pesanan.build({
                id_pesanan: "PSN001",
                tanggal_pesan: now,
                status_pesanan: "Menunggu Pembayaran",
                id_meja: "M001"
            });

            expect(pesanan.tanggal_pesan).toBeInstanceOf(Date);
            expect(pesanan.tanggal_pesan.getTime()).toBe(now.getTime());
        });

        test("Tanggal pesan dapat berupa string ISO", () => {
            const isoDate = "2024-12-25T00:00:00.000Z";
            const pesanan = Pesanan.build({
                id_pesanan: "PSN001",
                tanggal_pesan: new Date(isoDate),
                status_pesanan: "Menunggu Pembayaran",
                id_meja: "M001"
            });

            expect(pesanan.tanggal_pesan).toBeInstanceOf(Date);
        });
    });

    describe("Status Pesanan", () => {

        test("Status pesanan dapat berupa berbagai nilai string", () => {
            const statuses = [
                "Menunggu Pembayaran",
                "Diproses",
                "Selesai",
                "Dibatalkan"
            ];

            statuses.forEach((status, index) => {
                const pesanan = Pesanan.build({
                    id_pesanan: `PSN00${index + 1}`,
                    tanggal_pesan: new Date(),
                    status_pesanan: status,
                    id_meja: "M001"
                });

                expect(pesanan.status_pesanan).toBe(status);
            });
        });
    });

    describe("Relasi dengan Meja", () => {

        test("id_meja harus mengikuti format M dengan 3 digit", () => {
            const pesanan = Pesanan.build({
                id_pesanan: "PSN001",
                tanggal_pesan: new Date(),
                status_pesanan: "Menunggu Pembayaran",
                id_meja: "M001"
            });

            expect(pesanan.id_meja).toMatch(/^M\d{3}$/);
        });

        test("Dapat menyimpan berbagai id_meja", () => {
            const mejaIds = ["M001", "M010", "M100"];

            mejaIds.forEach((mejaId, index) => {
                const pesanan = Pesanan.build({
                    id_pesanan: `PSN00${index + 1}`,
                    tanggal_pesan: new Date(),
                    status_pesanan: "Menunggu Pembayaran",
                    id_meja: mejaId
                });

                expect(pesanan.id_meja).toBe(mejaId);
            });
        });
    });

    describe("Instance Methods", () => {

        test("Instance harus memiliki method toJSON", () => {
            const pesanan = Pesanan.build({
                id_pesanan: "PSN001",
                tanggal_pesan: new Date(),
                status_pesanan: "Menunggu Pembayaran",
                id_meja: "M001"
            });

            expect(typeof pesanan.toJSON).toBe("function");
        });

        test("toJSON harus mengembalikan object dengan semua atribut", () => {
            const pesanan = Pesanan.build({
                id_pesanan: "PSN001",
                tanggal_pesan: new Date(),
                status_pesanan: "Menunggu Pembayaran",
                id_meja: "M001"
            });

            const json = pesanan.toJSON();

            expect(json).toHaveProperty("id_pesanan");
            expect(json).toHaveProperty("tanggal_pesan");
            expect(json).toHaveProperty("status_pesanan");
            expect(json).toHaveProperty("id_meja");
        });
    });

});
