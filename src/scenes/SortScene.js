import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENES } from '../config/game.js';
import { addText } from './ui/style.js';

// 임시 장면: 묶기 화면은 다음 작업에서 이 파일을 바꿔 만든다. 지금은 20장을 모은 뒤 멈추지 않게만 한다.
export default class SortScene extends Phaser.Scene {
  constructor() {
    super(SCENES.SORT);
  }

  create() {
    addText(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, '카드 묶기 화면은 준비 중이에요.', { size: 36, origin: [0.5, 0.5] });
  }
}
