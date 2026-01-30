const mongoose = require("mongoose");

const DeliverySchema = new mongoose.Schema(
  {
    deliveryNumber: { type: String, required: true }, // container
    vehiclePlate: { type: String, default: "" },      // transportadora no seu form
    observations: { type: String, default: "" },
    driverName: { type: String, default: "" },        // nome do motorista

    status: { type: String, enum: ["pending", "submitted"], default: "pending" },

    // usuário que criou (motorista/admin)
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userName: { type: String, default: "" },
    userEmail: { type: String, default: "" },

    deliveryDate: { type: Date, default: Date.now },

    // caminhos/urls dos documentos
    documents: {
      canhotNF: { type: String, default: null },
      canhotCTE: { type: String, default: null },
      diarioBordo: { type: String, default: null },
      devolucaoVazio: { type: String, default: null },
      retiradaCheio: { type: String, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Delivery", DeliverySchema);
