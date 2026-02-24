import React from "react";
import BrandStoreList from "./BrandStoreList";

const ShowJweleryStores = ({ categoryMarkers }) => {
  return (
    <React.Fragment>
      <div style={{ border: "1px solid #233044", height: "79.5vh" }}>
        <div
          style={{
            height: "calc(100% - 30px)",
            overflowY: "auto",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}>
          {categoryMarkers?.jewellery?.length > 0 && (
            <BrandStoreList
              brandName='JEWELLERY'
              stores={categoryMarkers.jewellery}
              color='red'
            />
          )}

          {categoryMarkers?.competitor?.length > 0 && (
            <BrandStoreList
              brandName='COMPETITORS'
              stores={categoryMarkers.competitor}
              color='blue'
            />
          )}
          {categoryMarkers?.ourBrand?.length > 0 && (
            <BrandStoreList
              brandName='OUR BRAND'
              stores={categoryMarkers.ourBrand}
              color='green'
            />
          )}
          {categoryMarkers?.retail?.length > 0 && (
            <BrandStoreList
              brandName='RETAILS'
              stores={categoryMarkers.retail}
              color='orange'
            />
          )}
        </div>
      </div>
    </React.Fragment>
  );
};

export default ShowJweleryStores;
