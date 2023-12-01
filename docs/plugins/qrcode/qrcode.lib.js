let chunkString = (content, length) =>
  range0(Math.ceil(len(content) / length)).map((i) =>
    content.substr(i++ * length, length),
  );
let pad0 = (count, content = "") => content.padStart(count, "0");
let numToBits = (content, count) => pad0(count, content.toString(2));
let bitsToArray = (bits) => [...bits].map(Number);
let range = (from, to) => Array.from({ length: to - from }, (_, i) => i + from);
let range0 = (to) => range(0, to);
let createMatrix = (dimensions) => {
  let base = range0(dimensions).map((_) => null);
  return base.map((_) => base.slice());
};
let cloneMatrix = (matrix) => matrix.slice().map((m) => m.slice());
let len = (array) => array.length;
let mergeMatrices = (matrix1, matrix2) => {
  let result2 = cloneMatrix(matrix1);
  iterateOverMatrix(
    matrix1,
    (val, x, y) => val === null && (result2[y][x] = matrix2[y][x]),
  );
  return result2;
};
let iterateOverMatrix = (matrix, fn, fnSecondary = () => {}, direction = 0) => {
  matrix.map(
    (row, y) => (
      row.map((val, x) =>
        direction === 0
          ? fn(val, x, y, matrix)
          : fn(matrix[x][y], y, x, matrix),
      ),
      fnSecondary(y, matrix)
    ),
  );
};
let encodeUtf8 = (s) => {
  let ci = 0,
    bytes = [],
    c;
  for (; ci < len(s); ci++) {
    if ((c = s.charCodeAt(ci)) < 128 && bytes.push(c)) continue;
    if (c < 2048) bytes.push((c >> 6) | 192);
    else {
      if (c > 55295 && c < 56320) {
        c = 65536 + ((c & 1023) << 10) + (s.charCodeAt(++ci) & 1023);
        bytes.push((c >> 18) | 240, ((c >> 12) & 63) | 128);
      } else bytes.push((c >> 12) | 224);
      bytes.push(((c >> 6) & 63) | 128);
    }
    bytes.push((c & 63) | 128);
  }
  return bytes;
};
var EcLevels = /* @__PURE__ */ ((EcLevels2) => {
  EcLevels2[(EcLevels2["L"] = 0)] = "L";
  EcLevels2[(EcLevels2["M"] = 1)] = "M";
  EcLevels2[(EcLevels2["Q"] = 2)] = "Q";
  EcLevels2[(EcLevels2["H"] = 3)] = "H";
  return EcLevels2;
})(EcLevels || {});
let qrDefinitionTable = chunkString(
  "0011030906060a020325091a14141a0908441834100a1406126710231816090218921633100814041056091916111a0812651022100718061682142914101807219a1427120916051056183316111a081268213a1a1416051678142718121a0718911428161214042199163012091605147316312116160516831a35161121081a911a361a141a0721a318331a141a071a971834181318061a91183121161a081a9a18321a1421091a951a362116160621a41a372116210821a01a352116210918901a37211621081a981a361a14210921a51a352115210821a01a3521162108219a1a352115210821991a372116210821991a362116210821991a362116210821991a362116210821991a362116210921a41a372116210821a41a372116210821a51a362116210821a51a362116210821a01a372116210821a11a3721162108",
  2,
).map((s) => parseInt(s, 11) + 7);
let getDimensions = (version) => 17 + 4 * version;
let getSupportedBits = (version) => {
  let dimensions = getDimensions(version);
  let alignmentElementsDimensions = 2 + (0 | (version / 7));
  let alignmentModules =
    (5 * alignmentElementsDimensions - 1) *
      (5 * alignmentElementsDimensions - 1) -
    56;
  return (
    -191 -
    2 * dimensions +
    dimensions * dimensions -
    alignmentModules * +(version > 1) -
    36 * +(version > 6)
  );
};
let getRemainderBits = (version) => getSupportedBits(version) % 8;
let getAlignmentPattern = (version) => {
  let last = 4 + 4 * version;
  let elements = 0 | (version / 7);
  let startStep = 0 | (last / (elements + 1));
  let firstStep = startStep;
  let nextStep = firstStep;
  if (elements > 1) {
    nextStep = 2 * Math.ceil(((last - startStep) / elements + 1e-4) / 2);
    firstStep = last - nextStep * elements;
  }
  return version < 2
    ? []
    : [6, ...range0(elements + 1).map((i) => 6 + firstStep + i * nextStep)];
};
let getGroups = (version, ecLevel) => {
  let index = version * 8 - 8 + ecLevel * 2,
    ecPerBlock = qrDefinitionTable[index],
    wordsPerBlock = qrDefinitionTable[++index],
    bytes = 0 | (getSupportedBits(version) / 8),
    y = 0,
    x = 0,
    sumBlock = ecPerBlock + wordsPerBlock;
  for (; x < 57; x++)
    if ((y = (bytes - sumBlock * x) / (sumBlock + 1)) % 1 === 0) break;
  let result2 = [{ blocks: x, wordsPerBlock, ecPerBlock }];
  y > 0 && wordsPerBlock++;
  result2.push({ blocks: y, wordsPerBlock, ecPerBlock });
  return result2;
};
let getChracterCountBits = (version) => (version <= 9 ? 8 : 16);
let getRequiredNumberOfBits = (groups2) =>
  groups2.reduce((acc, val) => acc + val.wordsPerBlock * val.blocks, 0) * 8;
let versionLookup = [];
let requiredNumberOfBits, characterCountBits, groups;
range(1, 41).map((version) => {
  range0(4).map((ecLevel) => {
    groups = getGroups(version, ecLevel);
    requiredNumberOfBits = getRequiredNumberOfBits(groups);
    characterCountBits = getChracterCountBits(version);
    versionLookup.push({
      ecLevel,
      version,
      groups,
      requiredNumberOfBits,
      characterCountBits,
      upperLimit: 0 | ((requiredNumberOfBits - (4 + characterCountBits)) / 8),
      remainderBits: getRemainderBits(version),
      dimensions: getDimensions(version),
      alignmentPattern: getAlignmentPattern(version),
    });
  });
});
let getSmallestVersion = (length, ecLevel) => {
  let lookup = versionLookup.filter(
    (v) => v.ecLevel === ecLevel && v.upperLimit >= length,
  );
  if (!lookup) throw new Error("Input too long!");
  return lookup[0];
};
let getParameters = (content, ecLevel) =>
  getSmallestVersion(len(encodeUtf8(content)), ecLevel);
let score = 0;
let getLineGroupScore = (matrix) => {
  let currentColor = false;
  let currentRun = 0;
  let scoreLineGroupCondition = () => {
    score += currentRun >= 5 ? currentRun - 2 : 0;
    currentRun = 0;
  };
  [0, 1].map((dir) => {
    iterateOverMatrix(
      matrix,
      (value) => {
        if (value !== currentColor) {
          scoreLineGroupCondition();
          currentColor = value;
        }
        currentRun++;
      },
      scoreLineGroupCondition,
      dir,
    );
  });
};
let getSquareScore = (matrix) => {
  iterateOverMatrix(matrix, (_, x, y) => {
    if (x < len(matrix) - 1 && y < len(matrix) - 1) {
      let squareBitMask = range0(4).reduce(
        (acc, dirBitMask, i) =>
          acc | (+matrix[y + (dirBitMask >> 1)][x + (dirBitMask & 1)] << i),
        0,
      );
      score += squareBitMask % 15 === 0 ? 3 : 0;
    }
  });
};
let getFinderConfusionScore = (matrix) => {
  let patterns = [
    { template: bitsToArray("10111010000"), current: 0 },
    { template: bitsToArray("00001011101"), current: 0 },
  ];
  [0, 1].map((dir) => {
    iterateOverMatrix(
      matrix,
      (value) =>
        patterns.map((pattern) => {
          pattern.current +=
            +value === pattern.template[pattern.current] ? 1 : -pattern.current;
          if (pattern.current >= len(pattern.template)) {
            score += 40;
            pattern.current = 0;
          }
        }),
      () => patterns.map((pattern) => (pattern.current = 0)),
      dir,
    );
  });
};
let getColorImbalanceScore = (matrix) => {
  let darkCount = 0;
  iterateOverMatrix(matrix, (value) => (darkCount += +value));
  let percentage = +((darkCount / (len(matrix) * len(matrix))) * 100);
  let lower = percentage - (percentage & 5);
  score +=
    Math.min(...[lower, lower + 5].map((el) => Math.abs(el - 50) / 5)) * 10 + 5;
};
let maskingMethods = [
  (x, y) => (x + y) % 2,
  (x, y) => y % 2,
  (x) => x % 3,
  (x, y) => (x + y) % 3,
  (x, y) => (0 | (y / 2 + (0 | (x / 3)))) % 2,
  (x, y) => ((x * y) % 2) + ((x * y) % 3),
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2,
];
let evaluateMasking = (matrix) => (
  (score = 0),
  getLineGroupScore(matrix),
  getSquareScore(matrix),
  getFinderConfusionScore(matrix),
  getColorImbalanceScore(matrix)
);
let maskMatrix = (matrix, condition) => {
  let copy = cloneMatrix(matrix);
  iterateOverMatrix(copy, (value, x, y) =>
    !condition(x, y) ? (copy[y][x] = !value) : 0,
  );
  return copy;
};
let applyMasking = (patternMatrix, dataMatrix) =>
  maskingMethods
    .map((method) =>
      mergeMatrices(patternMatrix, maskMatrix(dataMatrix, method)),
    )
    .reduce(
      (acc, matrix, mask) => (
        evaluateMasking(matrix),
        score < acc.score ? { score, mask, matrix } : acc
      ),
      {
        score: 1 << 30,
        mask: 0,
        matrix: [],
      },
    );
let applyFinderPatterns = (matrix) => {
  let dimensions = len(matrix);
  let dimensionsSubSeven = dimensions - 7;
  let drawSquares = (x, y) => {
    matrix[y + 3][x + 3] = true;
    range0(3).map((j) => {
      range(j, 7 - j).map(
        (i) =>
          (matrix[y + j][x + i] =
            matrix[y + 6 - j][x + i] =
            matrix[y + i][x + j] =
            matrix[y + i][x + 6 - j] =
              j % 2 === 0),
      );
    });
  };
  range0(8).map(
    (i) =>
      (matrix[i][7] =
        matrix[7][i] =
        matrix[7][dimensions - i - 1] =
        matrix[dimensions - i - 1][7] =
        matrix[dimensionsSubSeven - 1][i] =
        matrix[i][dimensionsSubSeven - 1] =
          false),
  );
  drawSquares(0, 0);
  drawSquares(0, dimensionsSubSeven);
  drawSquares(dimensionsSubSeven, 0);
};
let applyTimingPatterns = (matrix) =>
  range(7, len(matrix) - 7).map(
    (i) => (matrix[6][i] = matrix[i][6] = i % 2 === 0),
  );
let applyDarkModule = (matrix) => (matrix[matrix.length - 8][8] = true);
let applyReservedAreas = (matrix, version) => {
  let dimensions = len(matrix);
  [range0(9), range(dimensions - 8, dimensions)]
    .flat()
    .map((i) => (matrix[i][8] = matrix[8][i] = false));
  if (version >= 7)
    range0(3).map((i) =>
      range0(6).map(
        (j) =>
          (matrix[dimensions - 11 + i][j] = matrix[j][dimensions - 11 + i] =
            false),
      ),
    );
};
let applyAlignmentPatterns = (matrix, locations) =>
  locations.map((x, i) =>
    locations
      .slice(
        +(i === 0 || i === len(locations) - 1),
        i > 0 ? len(locations) : -1,
      )
      .map((y) =>
        range0(3).map((j) =>
          range(j, 5 - j).map(
            (i2) =>
              (matrix[y - 2 + j][x - 2 + i2] =
                matrix[y + 2 - j][x - 2 + i2] =
                matrix[y - 2 + i2][x - 2 + j] =
                matrix[y - 2 + i2][x + 2 - j] =
                  j % 2 === 0),
          ),
        ),
      ),
  );
let getPatternMatrix = (config) => {
  let patternMatrix = createMatrix(config.dimensions);
  applyFinderPatterns(patternMatrix);
  applyAlignmentPatterns(patternMatrix, config.alignmentPattern);
  applyReservedAreas(patternMatrix, config.version);
  applyTimingPatterns(patternMatrix);
  applyDarkModule(patternMatrix);
  return patternMatrix;
};
let exponents = {};
let logs = { 1: 0 };
range0(255).reduce(
  (acc, i) => (
    (logs[(exponents[i] = acc)] = i), acc & 128 ? (acc * 2) ^ 285 : acc * 2
  ),
  1,
);
let mul = (x, y) => (x * y === 0 ? 0 : exponents[(logs[x] + logs[y]) % 255]);
let result$1;
let mulPoly = (poly1, poly2) => (
  (result$1 = []),
  poly1.map((p1, j) => poly2.map((p2, i) => (result$1[j + i] ^= mul(p2, p1)))),
  result$1
);
let divPoly = (dividend, divisor) => {
  result$1 = dividend.slice();
  range0(len(dividend) - len(divisor) + 1).map((i) =>
    range(1, len(divisor)).map(
      (j) => (result$1[i + j] ^= mul(divisor[j], result$1[i])),
    ),
  );
  return result$1.slice(len(result$1) - len(divisor) + 1);
};
let generatorPoly = (n) =>
  range0(n).reduce((acc, i) => mulPoly(acc, [1, exponents[i]]), [1]);
let applyFormatInformation = (ecLevel, mask, matrix) => {
  let bits = chunkString("01001110", 2)[ecLevel] + numToBits(mask, 3);
  let formatInfo = numToBits(
    parseInt(
      bits +
        pad0(
          10,
          divPoly(
            bitsToArray(bits + pad0(10)),
            bitsToArray("10100110111"),
          ).join(""),
        ),
      2,
    ) ^ 21522,
    15,
  );
  let a = 0,
    b = 0;
  [range0(8 + 1), range(len(matrix) - 7, len(matrix))]
    .flat()
    .map((h, i, arr) => {
      let v = arr[arr.length - 1 - i];
      if (h !== 6) matrix[8][h] = formatInfo[a++] === "1";
      if (v !== 6 && v !== len(matrix) - 8)
        matrix[v][8] = formatInfo[b++] === "1";
    });
  return matrix;
};
let applyVerisonInformation = (version, matrix) => {
  if (version < 7) return matrix;
  let bits = numToBits(version, 6);
  let versionInfo =
    bits +
    pad0(
      12,
      divPoly(bitsToArray(bits + pad0(12)), bitsToArray("1111100100101")).join(
        "",
      ),
    );
  let d = 0;
  range0(6).map((x) =>
    range0(3).map(
      (y) =>
        (matrix[matrix.length - 9 - y][5 - x] = matrix[5 - x][
          len(matrix) - 9 - y
        ] =
          versionInfo[d++] === "1"),
    ),
  );
  return matrix;
};
let applyData = (patternMatrix, data) => {
  let dataMatrix = createMatrix(len(patternMatrix)),
    MAX = len(patternMatrix) - 1,
    x = MAX,
    y = MAX,
    dx = 0,
    d = 0,
    direction = -1;
  while (d < len(data)) {
    patternMatrix[y][x - dx] === null &&
      (dataMatrix[y][x - dx] = data[d++] === "1");
    if (dx === 1) {
      y += direction;
      if (y < 0 || y > MAX) {
        y = (MAX + MAX * direction) / 2;
        direction *= -1;
        x -= 2;
      }
    }
    dx ^= 1;
    x >= 6 && x <= 7 && (x = 5);
  }
  return dataMatrix;
};
let place = (config, data) => {
  let patternMatrix = getPatternMatrix(config);
  let dataMatrix = applyData(patternMatrix, data);
  let { mask, matrix } = applyMasking(patternMatrix, dataMatrix);
  applyFormatInformation(config.ecLevel, mask, matrix);
  return applyVerisonInformation(config.version, matrix);
};
let getEcWords = (message, ecCodeWordsCount) =>
  divPoly(
    message.concat(range0(ecCodeWordsCount).map((_) => 0)),
    generatorPoly(ecCodeWordsCount),
  );
let encodeSymbols = (content) =>
  encodeUtf8(content)
    .map((el) => numToBits(el, 8))
    .join("");
let currentElement;
let createBlocks = (config, encodedData) => (
  (currentElement = 0),
  config.groups
    .map((group) =>
      range0(group.blocks).map((i) =>
        range0(group.wordsPerBlock).map((j) => encodedData[currentElement++]),
      ),
    )
    .flat()
);
let result;
let interleave = (blocks2) => (
  (result = []),
  range0(len(blocks2)).map((j) =>
    range0(len(blocks2[j])).map(
      (i) => (result[i * len(blocks2) + j] = blocks2[j][i]),
    ),
  ),
  result
);
let blocks;
let encode = (config, content) => (
  (blocks = createBlocks(
    config,
    chunkString(
      fillUpBits(
        config.requiredNumberOfBits,
        "0100" +
          numToBits(len(content), config.characterCountBits) +
          encodeSymbols(content),
      ),
      8,
    ).map((el) => parseInt(el, 2)),
  )),
  [
    interleave(blocks),
    interleave(blocks.map((b) => getEcWords(b, config.groups[0].ecPerBlock))),
  ]
    .flat()
    .map((uint) => numToBits(uint, 8))
    .join("") + pad0(config.remainderBits)
);
let fillUpBits = (requiredNumberOfBits2, bits) => {
  bits += pad0(
    requiredNumberOfBits2 - len(bits) < 4
      ? requiredNumberOfBits2 - len(bits)
      : 4,
  );
  bits += pad0(8 - (len(bits) % 8));
  return bits
    .padEnd(requiredNumberOfBits2, "1110110000010001")
    .substr(0, requiredNumberOfBits2);
};
window.QRCodeGetMatrix = (content, ecLevel = EcLevels.L) => {
  let config = getParameters(content, ecLevel);
  return place(config, encode(config, content));
};
window.QRCodeRender = (matrix, color = "#000") => {
  let { d, dim } = renderPath(matrix);
  return `<svg viewBox="0 0 ${dim} ${dim}" stroke=${color} stroke-width=1.05 xmlns=http://www.w3.org/2000/svg><path d="${d}"/></svg>`;
};
let renderPath = (matrix) => {
  let d = "";
  matrix.map((row, y) => {
    let lastX = 0,
      x = 0,
      len2;
    d += `M${5} ${y + 5}`;
    for (; x < matrix.length; x++) {
      if (row[x]) {
        len2 = 0;
        while (row[++len2 + x]);
        d += `m${x - lastX} 0h${len2}`;
        lastX = (x += len2 - 1) + 1;
      }
    }
  });
  return { d, dim: matrix.length + 10 };
};
