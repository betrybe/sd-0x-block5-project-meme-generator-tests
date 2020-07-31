import 'cypress-file-upload';

const evaluateOffset = (doc, selector, offsetType) => {
  return doc.querySelector(selector).getBoundingClientRect()[`${offsetType}`];
};

const isOnSameHorizontal = (firstElement, secondElement) =>
  (firstElement.top >= secondElement.top &&
    firstElement.bottom <= secondElement.bottom) ||
  (secondElement.top >= firstElement.top && secondElement.bottom <= firstElement.bottom);

const isOnSameVertical = (firstElement, secondElement) =>
  (firstElement.left >= secondElement.left &&
    firstElement.right <= secondElement.right) ||
  (secondElement.left >= firstElement.left && secondElement.right <= firstElement.right);

const isOverEachother = (backgroundElement, forefrontElement) => {
  backgroundElement.bottom = backgroundElement.top + backgroundElement.height;
  backgroundElement.right = backgroundElement.left + backgroundElement.width;

  forefrontElement.bottom = forefrontElement.top + forefrontElement.height;
  forefrontElement.right = forefrontElement.left + forefrontElement.width;

  return (
    isOnSameHorizontal(backgroundElement, forefrontElement) &&
    isOnSameVertical(backgroundElement, forefrontElement)
  );
};

const checkFullOverlappage = (backgroundSelector, forefrontSelector) => {
  cy.document().then(doc => {
    const backgroundElement = {
      top: evaluateOffset(doc, backgroundSelector, 'top'),
      height: evaluateOffset(doc, backgroundSelector, 'height'),
      left: evaluateOffset(doc, backgroundSelector, 'left'),
      width: evaluateOffset(doc, backgroundSelector, 'width'),
    };

    const forefrontElement = {
      top: evaluateOffset(doc, forefrontSelector, 'top'),
      height: evaluateOffset(doc, forefrontSelector, 'height'),
      left: evaluateOffset(doc, forefrontSelector, 'left'),
      width: evaluateOffset(doc, forefrontSelector, 'width'),
    };

    expect(isOverEachother(backgroundElement, forefrontElement)).to.be.true;

    // Text has volume
    expect(forefrontElement.top).to.not.be.undefined;
    expect(forefrontElement.bottom).to.not.be.undefined;
    expect(forefrontElement.left).to.not.be.undefined;
    expect(forefrontElement.right).to.not.be.undefined;
    expect(forefrontElement.right != forefrontElement.left).to.be.true;
    expect(forefrontElement.top != forefrontElement.bottom).to.be.true;
  });
};

const typeTextAndCheckItsPosition = (container, child) => {
  // It inserts text in the input and page when typed
  typeText();

  checkTypedTextIsVisible();

  // Has one element inside another
  checkFullOverlappage(container, child);
};

const typeText = () => {
  cy.get('#text-input')
    .type('My awesome meme')
    .should('have.value', 'My awesome meme');
}

const checkTypedTextIsVisible = () => {
  cy.contains(/^My awesome meme$/).should('be.visible');
}

// TODO: Testar se a imagem que está sendo feito upload está sendo renderizado na página.
const memeUpload = () => {
  const fileName = 'meme.jpeg';
  cy.fixture(fileName).then(fileContent => {
    cy.get('#meme-insert').upload({
      fileContent,
      fileName,
      mimeType: 'image/jpeg',
    });
  });
};

//-------

describe("O site deve possuir uma caixa de texto com a qual quem usa pode interagir para inserir texto em cima da imagem escolhida.", () => {
  beforeEach(() => {
    cy.viewport(1366, 768);
    cy.visit('/');
  })

  it("O input de texto existe e conseguimos inputar texto nele", () => {
    typeText();
  })

  it("O texto digitado no input é visível na tela", () => {
    typeText();
    checkTypedTextIsVisible();
  })

  it("Existe um elemento de container para onde o texto será mostrado", () => {
    typeText();
    checkTypedTextIsVisible();
    checkFullOverlappage('#meme-image-container', '#meme-text');
  })
});

describe("O site deve permitir que quem usa faça upload de uma imagem de seu computador.", () => {
  beforeEach(() => {
    cy.viewport(1366, 768);
    cy.visit('/');
  })

  it("É possível carregar uma imagem através do elemento correto", () => {
    memeUpload();
  })

  it("A imagem carregada é exibida dentro do elemento correto", () => {
    memeUpload();
    cy.get('#meme-image').should('be.visible');
  })

  it("O texto é inserido corretamente sobre a imagem", () => {
    memeUpload();
    cy.get('#meme-image').should('be.visible');
    typeTextAndCheckItsPosition('#meme-image', '#meme-text');
  })
});

describe("O site deve ter uma moldura no container. A moldura deve ter 1 pixel de largura, deve ser preta e do tipo 'solid'. A área onde a imagem aparecerá deve ter fundo branco.", () => {
  beforeEach(() => {
    cy.viewport(1366, 768);
    cy.visit('/');
    cy.reload();
  })

  it("O elemento que serve de container para a imagem deve ter o a cor de fundo branca", () => {
    // Image container has a white background
    cy.get('#meme-image-container').should($container => {
      expect($container).to.have.css('background-color', 'rgb(255, 255, 255)');
    });
  })

  it("O elemento que serve de container para a imagem deve ter uma borda preta, sólida, com 1 pixel de largura", () => {
    cy.get('#meme-image-container').should(
      'have.css',
      'border',
      '1px solid rgb(0, 0, 0)',
    );
  })

  it("A imagem deve estar totalmente contida dentro do elemento identificado como `meme-image-container`", () => {
    // Image is precisely inside it's container
    memeUpload();
    checkFullOverlappage('#meme-image-container', '#meme-image');
  })
});

describe("O texto que será inserido sobre a imagem deve ter uma cor, sombra e tamanho específicos.", () => {
  beforeEach(() => {
    cy.viewport(1366, 768);
    cy.visit('/');
    cy.reload();
  })

  it("O texto do elemento `meme-text` deve ter uma sombra preta, de 5 pixels na horizontal, 5 pixels na vertical e um raio de desfoque de 5 pixels", () => {
    cy.get('#meme-text').should($text => {
      expect($text).to.have.css('text-shadow', 'rgb(0, 0, 0) 5px 5px 5px');
    });
  })

  it("O texto do elemento `meme-text` deve ter a fonte com o tamanho de 30 pixels", () => {
    cy.get('#meme-text').should(
      'have.css',
      'font-size',
      '30px',
    );
  })

  it("O texto do elemento `meme-text` deve estar na cor branca", () => {
    cy.get('#meme-text').should(
      'have.css',
      'color',
      'rgb(255, 255, 255)',
    );
  })
});

describe("Limite o tamanho do texto que o usuário pode inserir.", () => {
  beforeEach(() => {
    cy.viewport(1366, 768);
    cy.visit('/');
    cy.reload();
  })

  it("A quantidade máxima de caracteres digitáveis no elemento `text-input` deve ser 60.", () => {
    cy.get('#text-input')
      .type('I have written a line that has precisely sixty-one characters')
      .should(
        'have.value',
        'I have written a line that has precisely sixty-one character',
      );
  })
});

// Bonus requirements

describe("Permita a quem usa customizar o meme escolhido acrescentando a ele uma de três bordas. A página deve ter três botões, que ao serem clicados devem cada um trocar a própria borda ao redor do container.", () => {
  beforeEach(() => {
    cy.viewport(1366, 768);
    cy.visit('/');
  })

  it("O botão com identificado com id `fire` funciona corretamente.", () => {
    cy.get('#fire').should(
      'have.css',
      'background-color',
      'rgb(255, 0, 0)',
    );
    cy.get('#fire').click();
    cy.get('#meme-image-container').should(
      'have.css',
      'border',
      '3px dashed rgb(255, 0, 0)',
    );
  })

  it("O botão com identificado com id `water` funciona corretamente.", () => {
    cy.get('#water').should(
      'have.css',
      'background-color',
      'rgb(0, 0, 255)',
    );
    cy.get('#water').click();
    cy.get('#meme-image-container').should(
      'have.css',
      'border',
      '5px double rgb(0, 0, 255)',
    );
  })

  it("O botão com identificado com id `earth` funciona corretamente.", () => {
    cy.get('#earth').should(
      'have.css',
      'background-color',
      'rgb(0, 128, 0)',
    );
    cy.get('#earth').click();
    cy.get('#meme-image-container').should(
      'have.css',
      'border',
      '6px groove rgb(0, 128, 0)',
    );
  })
});

describe("Tenha um conjunto de quatro imagens pré prontas de memes famosos para o usuário escolher. Mostre miniaturas das imagens e, mediante clique do usuário, essa imagem deve aparecer dentro da moldura do elemento de container.", () => {
  beforeEach(() => {
    cy.viewport(1366, 768);
    cy.visit('/');
  })

  it("As imagens prontas apresentam o comportamente esperado.", () => {
    [1, 2, 3, 4].map(memeId => {
      cy.get(`#meme-${memeId}`).click();
      cy.get('#meme-image')
        .should('have.attr', 'src')
        .and('match', new RegExp(`imgs/meme${memeId}.png$`));
    });
  })
});
