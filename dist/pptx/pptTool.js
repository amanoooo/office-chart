"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PptTool = void 0;
class PptTool {
    constructor(xmlTool) {
        this.xmlTool = xmlTool;
        this.addSlidePart = () => __awaiter(this, void 0, void 0, function* () {
            const pptParts = yield this.xmlTool.readXml('[Content_Types].xml');
            const slides = pptParts['Types']['Override'].filter(part => {
                return part.$.ContentType === 'application/vnd.openxmlformats-officedocument.presentationml.slide+xml';
            });
            const slidesIds = slides.map(slide => {
                return slide.$.PartName.split('/ppt/slides/slide')[1].split('.xml')[0];
            });
            const id = Math.max(slidesIds) + 1;
            pptParts['Types']['Override'].push({
                '$': {
                    ContentType: 'application/vnd.openxmlformats-officedocument.presentationml.slide+xml',
                    PartName: `/ppt/slides/slide${id}.xml`
                }
            });
            // pptParts['Types']['Override'].push(
            //     {
            //         '$':
            //         {
            //             ContentType:
            //                 'application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml',
            //             PartName: `/ppt/slideMasters/slideMaster${id}.xml`
            //         }
            //     }
            // )
            yield this.xmlTool.write(`[Content_Types].xml`, pptParts);
            const relId = yield this.addSlidePPTRels(id);
            yield this.addSlideToPPT(relId);
            return id;
        });
        this.addSlidePPTRels = (id) => __awaiter(this, void 0, void 0, function* () {
            const pptRel = yield this.xmlTool.readXml('ppt/_rels/presentation.xml.rels');
            const relId = pptRel.Relationships.Relationship.length + 1;
            pptRel.Relationships.Relationship.push({
                '$': {
                    Id: 'rId' + relId,
                    Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide',
                    Target: `slides/slide${id}.xml`
                }
            });
            // pptRel.Relationships.Relationship.push({
            //     '$':
            //     {
            //         Id: 'rId' + relId,
            //         Type:
            //             'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster',
            //         Target: `slideMasters/slideMaster${id + 1}.xml`
            //     }
            // })
            this.xmlTool.write(`ppt/_rels/presentation.xml.rels`, pptRel);
            yield this.addSlideRels(id);
            return relId;
        });
        this.addSlideRels = (id) => __awaiter(this, void 0, void 0, function* () {
            const slideRel = yield this.xmlTool.readXml('ppt/slides/_rels/slide1.xml.rels');
            return this.xmlTool.write(`ppt/slides/_rels/slide${id}.xml.rels`, slideRel);
        });
        this.addSlideToPPT = (relId) => __awaiter(this, void 0, void 0, function* () {
            const ppt = yield this.xmlTool.readXml('ppt/presentation.xml');
            // let slideList = ppt['p:presentation']['p:sldIdLst'];
            if (Array.isArray(ppt['p:presentation']['p:sldIdLst']['p:sldId'])) {
                const list = ppt['p:presentation']['p:sldIdLst']['p:sldId'];
                // console.log(list, ppt['p:presentation']['p:sldIdLst']['p:sldId'])
                ppt['p:presentation']['p:sldIdLst']['p:sldId'].push({
                    '$': { id: parseInt(list[list.length - 1].$.id, 10) + 1, 'r:id': 'rId' + relId }
                });
            }
            else {
                ppt['p:presentation']['p:sldIdLst']['p:sldId'] = [
                    {
                        '$': ppt['p:presentation']['p:sldIdLst']['p:sldId'].$
                    },
                    {
                        '$': { id: parseInt(ppt['p:presentation']['p:sldIdLst']['p:sldId'].$.id, 10) + 1, 'r:id': 'rId' + relId }
                    }
                ];
            }
            return this.xmlTool.write('ppt/presentation.xml', ppt);
        });
        this.removeTemplateSlide = () => __awaiter(this, void 0, void 0, function* () {
            const ppt = yield this.xmlTool.readXml('ppt/presentation.xml');
            ppt['p:presentation']['p:sldIdLst']['p:sldId'] = ppt['p:presentation']['p:sldIdLst']['p:sldId'].filter(slide => {
                return slide.$['r:id'] !== 'rId6';
            });
            return this.xmlTool.write('ppt/presentation.xml', ppt);
        });
        this.createSlide = (id) => __awaiter(this, void 0, void 0, function* () {
            const resSlide = yield this.xmlTool.readXml('ppt/slides/slide1.xml');
            yield this.xmlTool.write(`ppt/slides/slide${id}.xml`, resSlide);
            // await this.addSlideMaster(id);
            return resSlide;
        });
        this.addSlideMaster = (id) => __awaiter(this, void 0, void 0, function* () {
            const resMasterSlide = yield this.xmlTool.readXml('ppt/slideMasters/slideMaster1.xml');
            yield this.xmlTool.write(`ppt/slideMasters/slideMaster${id}.xml`, resMasterSlide);
            const resMasterSlideRel = yield this.xmlTool.readXml('ppt/slideMasters/_rels/slideMaster1.xml.rels');
            yield this.xmlTool.write(`ppt/slideMasters/_rels/slideMaster${id}.xml.rels`, resMasterSlideRel);
        });
        this.addTitle = (slide, id, text, opt) => __awaiter(this, void 0, void 0, function* () {
            slide['p:sld']['p:cSld']['p:spTree']['p:sp'][0]['p:txBody']['a:p']['a:r']['a:t'] = text;
            slide['p:sld']['p:cSld']['p:spTree']['p:sp'][0]['p:spPr']['a:xfrm']['a:off'].$.x = (opt === null || opt === void 0 ? void 0 : opt.x) || slide['p:sld']['p:cSld']['p:spTree']['p:sp'][0]['p:spPr']['a:xfrm']['a:off'].$.x;
            slide['p:sld']['p:cSld']['p:spTree']['p:sp'][0]['p:spPr']['a:xfrm']['a:off'].$.y = (opt === null || opt === void 0 ? void 0 : opt.y) || slide['p:sld']['p:cSld']['p:spTree']['p:sp'][0]['p:spPr']['a:xfrm']['a:off'].$.y;
            slide['p:sld']['p:cSld']['p:spTree']['p:sp'][0]['p:spPr']['a:xfrm']['a:ext'].$.cx = (opt === null || opt === void 0 ? void 0 : opt.cx) || slide['p:sld']['p:cSld']['p:spTree']['p:sp'][0]['p:spPr']['a:xfrm']['a:ext'].$.cx;
            slide['p:sld']['p:cSld']['p:spTree']['p:sp'][0]['p:spPr']['a:xfrm']['a:ext'].$.cy = (opt === null || opt === void 0 ? void 0 : opt.cy) || slide['p:sld']['p:cSld']['p:spTree']['p:sp'][0]['p:spPr']['a:xfrm']['a:ext'].$.cy;
            this.addColorAndSize(slide['p:sld']['p:cSld']['p:spTree']['p:sp'][0], opt);
            return this.xmlTool.write(`ppt/slides/slide${id}.xml`, slide);
        });
        this.addSubTitle = (slide, id, text, opt) => __awaiter(this, void 0, void 0, function* () {
            slide['p:sld']['p:cSld']['p:spTree']['p:sp'][1]['p:txBody']['a:p']['a:r']['a:t'] = text;
            slide['p:sld']['p:cSld']['p:spTree']['p:sp'][1]['p:spPr']['a:xfrm']['a:off'].$.x = (opt === null || opt === void 0 ? void 0 : opt.x) || slide['p:sld']['p:cSld']['p:spTree']['p:sp'][1]['p:spPr']['a:xfrm']['a:off'].$.x;
            slide['p:sld']['p:cSld']['p:spTree']['p:sp'][1]['p:spPr']['a:xfrm']['a:off'].$.y = (opt === null || opt === void 0 ? void 0 : opt.y) || slide['p:sld']['p:cSld']['p:spTree']['p:sp'][1]['p:spPr']['a:xfrm']['a:off'].$.y;
            slide['p:sld']['p:cSld']['p:spTree']['p:sp'][1]['p:spPr']['a:xfrm']['a:ext'].$.cx = (opt === null || opt === void 0 ? void 0 : opt.cx) || slide['p:sld']['p:cSld']['p:spTree']['p:sp'][1]['p:spPr']['a:xfrm']['a:ext'].$.cx;
            slide['p:sld']['p:cSld']['p:spTree']['p:sp'][1]['p:spPr']['a:xfrm']['a:ext'].$.cy = (opt === null || opt === void 0 ? void 0 : opt.cy) || slide['p:sld']['p:cSld']['p:spTree']['p:sp'][1]['p:spPr']['a:xfrm']['a:ext'].$.cy;
            this.addColorAndSize(slide['p:sld']['p:cSld']['p:spTree']['p:sp'][1], opt);
            return this.xmlTool.write(`ppt/slides/slide${id}.xml`, slide);
        });
        this.addText = (slide, id, text, opt) => __awaiter(this, void 0, void 0, function* () {
            const copy = JSON.parse(JSON.stringify(slide['p:sld']['p:cSld']['p:spTree']['p:sp'][1]));
            copy['p:txBody']['a:p']['a:r']['a:t'] = text;
            this.addColorAndSize(copy, opt);
            copy['p:spPr']['a:xfrm']['a:off'].$.x = (opt === null || opt === void 0 ? void 0 : opt.x) || copy['p:spPr']['a:xfrm']['a:off'].$.x;
            copy['p:spPr']['a:xfrm']['a:off'].$.y = (opt === null || opt === void 0 ? void 0 : opt.y) || 3190175;
            copy['p:spPr']['a:xfrm']['a:ext'].$.cx = (opt === null || opt === void 0 ? void 0 : opt.cx) || copy['p:spPr']['a:xfrm']['a:ext'].$.cx;
            copy['p:spPr']['a:xfrm']['a:ext'].$.cy = (opt === null || opt === void 0 ? void 0 : opt.cy) || copy['p:spPr']['a:xfrm']['a:ext'].$.cy;
            slide['p:sld']['p:cSld']['p:spTree']['p:sp'].push(copy);
            return this.xmlTool.write(`ppt/slides/slide${id}.xml`, slide);
        });
        this.addColorAndSize = (data, opt) => {
            if (opt === null || opt === void 0 ? void 0 : opt.color) {
                data['p:txBody']['a:p']['a:r']['a:rPr'] = {
                    $: { sz: "1500" },
                    'a:solidFill': { 'a:srgbClr': { $: { val: opt.color } } }
                };
            }
            if (opt === null || opt === void 0 ? void 0 : opt.size) {
                if (data['p:txBody']['a:p']['a:r']['a:rPr']) {
                    data['p:txBody']['a:p']['a:r']['a:rPr'].$.sz = opt.size.toString();
                }
                else {
                    data['p:txBody']['a:p']['a:r']['a:rPr'] = { $: { sz: opt.size.toString() } };
                }
            }
        };
    }
}
exports.PptTool = PptTool;
