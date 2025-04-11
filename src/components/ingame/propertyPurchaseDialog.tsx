import { forwardRef, useImperativeHandle } from "react";
import monopolyJSON from "../../assets/monopoly.json";

interface PropertyPurchaseDialogProps {
    location: number;
    onResponse: (b: string, info: any) => void;
    show: boolean;
}

export interface PropertyPurchaseDialogRef {
    show: (location: number) => void;
    hide: () => void;
}

const PropertyPurchaseDialog = forwardRef<PropertyPurchaseDialogRef, PropertyPurchaseDialogProps>((props, ref) => {
    const propretyMap = new Map(
        monopolyJSON.properties.map((obj) => {
            return [obj.posistion ?? 0, obj];
        })
    );

    useImperativeHandle(ref, () => ({
        show: (location: number) => {
            const proprety = propretyMap.get(location);
            if (proprety === undefined) return;

            const street = document.querySelector(".card-display-actions");
            if (street === null) return;
            street.classList.add("active");
            const overlay = document.querySelector(".overlay");
            if (overlay === null) return;
            overlay.classList.add("active");

            // Clear previous content
            street.innerHTML = "";

            // Create property purchase dialog
            const dialog = document.createElement("div");
            dialog.className = "property-purchase-dialog";
            street.appendChild(dialog);

            // Add property details
            const title = document.createElement("h3");
            title.textContent = proprety.name;
            dialog.appendChild(title);

            const price = document.createElement("p");
            price.textContent = `Price: $${proprety.price}`;
            dialog.appendChild(price);

            const rent = document.createElement("p");
            rent.textContent = `Rent: $${proprety.rent}`;
            dialog.appendChild(rent);

            if (proprety.multpliedrent) {
                const rentList = document.createElement("div");
                rentList.innerHTML = "<p>Rent with houses:</p><ul>";
                proprety.multpliedrent.forEach((r: number, i: number) => {
                    rentList.innerHTML += `<li>${i === 4 ? "Hotel" : `${i} house${i !== 1 ? "s" : ""}`}: $${r}</li>`;
                });
                rentList.innerHTML += "</ul>";
                dialog.appendChild(rentList);
            }

            // Add buttons
            const buttons = document.createElement("div");
            buttons.className = "buttons";

            const buyButton = document.createElement("button");
            buyButton.textContent = "Buy";
            buyButton.onclick = () => {
                props.onResponse("buy", {});
                dialog.remove();
            };
            buttons.appendChild(buyButton);

            const skipButton = document.createElement("button");
            skipButton.textContent = "Skip";
            skipButton.onclick = () => {
                props.onResponse("skip", {});
                dialog.remove();
            };
            buttons.appendChild(skipButton);

            dialog.appendChild(buttons);
        },
        hide: () => {
            const street = document.querySelector(".card-display-actions");
            if (street === null) return;
            street.classList.remove("active");
            const overlay = document.querySelector(".overlay");
            if (overlay === null) return;
            overlay.classList.remove("active");
        }
    }));

    return null;
});

export default PropertyPurchaseDialog; 