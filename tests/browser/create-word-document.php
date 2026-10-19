<?php

// Synthetic OOXML document used only by the isolated upload/browser check.
$path = __DIR__.'/../../storage/framework/testing/My_First_Word_Document.docx';
$zip = new ZipArchive;
if ($zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
    throw new RuntimeException('Cannot create browser fixture.');
}
$zip->addFromString('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
$zip->addFromString('_rels/.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
$zip->addFromString('word/document.xml', '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>My First Microsoft Word Document</w:t></w:r></w:p><w:p><w:r><w:t>My name is Example Learner. I am learning how to use Microsoft Word. Microsoft Word can be used to create letters, reports, school projects, resumes, and many other documents.</w:t></w:r></w:p><w:sectPr/></w:body></w:document>');
$zip->close();
echo 'Created synthetic browser upload document.'.PHP_EOL;
