const FRP_TYPE = {
    REGISTER: "01",
    REQUEST: "02",
    RESPONSE: "03",
};

const FRP_LEN = 60;

const frpWrite = (sk, id, type, context = "", length = "") => {
    id = (id || "").padEnd(32, "0");
    length = String(length || Buffer.from(context, "utf8").length).padEnd(19, "-");
    sk.write(`NFRP,${type},${id},${length}${context}`);
};

const frpRead = (str) => {
    let head = str.substr(0, FRP_LEN);
    let [_, type, id, length] = head.split(",");
    length = length.replace(/-/g, "") * 1;
    return {
        id,
        type,
        length,
        data: str.substr(FRP_LEN),
    };
};
module.exports = {
    FRP_LEN,
    FRP_TYPE,
    frpWrite,
    frpRead,
    // frpStringify,
    // frpParse,
};
