import React, { useState } from "react";
import Search from "antd/es/input/Search";

function InchModal({ open, onClose, setToken, tokenList }) {
  const [tokenSearch, setTokenSearch] = useState({});

  if (!open) return null;

  const onSearch = value => {
    let newTokenList = {};

    if (value.length === 42 && tokenList[value].address === value) {
      newTokenList[value] = tokenList[value];

    } else if (value.length > 1) {
      for (const tokenKey in tokenList) {
        if (tokenList[tokenKey].symbol.includes(value) || tokenList[tokenKey].name.includes(value)) {
          newTokenList[tokenKey] = tokenList[tokenKey];
        }
      }

    } else {
      newTokenList = {};
    }

    setTokenSearch(newTokenList);
  }

  return (
    <div style={{ overflow: "auto", height: "500px" }}>
      <Search placeholder="Search token" onSearch={onSearch} style={{ padding: "10px 20px" }} />
      {!tokenSearch
        ? null
        : Object.keys(tokenSearch).map((token, index) => (
            <div
              style={{
                padding: "5px 20px",
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
              }}
              onClick={() => {
                setToken(tokenList[token]);
                setTokenSearch({})
                onClose();
              }}
              key={index}
            >
              <img
                style={{
                  height: "32px",
                  width: "32px",
                  marginRight: "20px",
                }}
                src={tokenList[token].logoURI}
                alt="noLogo"
              />
              <div>
                <h4>{tokenList[token].name}</h4>
                <span
                  style={{
                    fontWeight: "600",
                    fontSize: "15px",
                    lineHeight: "14px",
                  }}
                >
                  {tokenList[token].symbol}
                </span>
              </div>
            </div>
          ))}
    </div>
  );
}

export default InchModal;
