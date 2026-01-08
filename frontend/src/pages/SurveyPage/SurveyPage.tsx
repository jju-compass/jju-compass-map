import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LandingNavbar, LandingFooter } from '../../components/landing';
import './SurveyPage.css';

interface SurveyData {
  affiliation: string;
  helpfulness: string;
  difficulty: string;
  feature_category: string;
  feature_review: string;
  feature_bookmark: string;
  feature_filter: string;
  additional_features: string;
  overall_satisfaction: string;
  dissatisfaction_reason: string;
  final_comment: string;
}

const likertFeatures = [
  { name: 'feature_category', label: "'한식', '카페' 등 카테고리 버튼으로 빠른 검색" },
  { name: 'feature_review', label: "사용자가 직접 남기는 '리뷰' 및 '별점' 기능" },
  { name: 'feature_bookmark', label: "자주 가는 곳을 저장하는 '북마크(즐겨찾기)' 기능" },
  { name: 'feature_filter', label: "현재 '영업 중'인 곳만 필터링하여 보여주는 기능" },
];

const SurveyPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SurveyData>({
    affiliation: '',
    helpfulness: '',
    difficulty: '',
    feature_category: '',
    feature_review: '',
    feature_bookmark: '',
    feature_filter: '',
    additional_features: '',
    overall_satisfaction: '',
    dissatisfaction_reason: '',
    final_comment: '',
  });

  const handleRadioChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTextChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 실제로는 서버에 제출하겠지만, 여기서는 알림만 표시
    alert('설문에 참여해주셔서 감사합니다!');
    navigate('/');
  };

  return (
    <div className="survey-page">
      <LandingNavbar />

      <div className="survey-container">
        <header className="survey-header">
          <h1>JJU Map 사용자 설문조사</h1>
          <p>
            <strong>[안내문]</strong>
            <br />
            안녕하십니까?
            <br />
            저희는 웹프로그래밍 수업에서 '전주대 주변 탐색지도(JJU Map)' 프로젝트를
            진행하고 있는 <strong>'나침반'</strong> 팀입니다.
            <br />
            <br />
            본 프로젝트는 신입생과 재학생 여러분이 전주대학교 주변의 다양한 장소를
            쉽고 빠르게 찾을 수 있도록 돕는 웹 서비스를 개발하는 것을 목표로 합니다.
            <br />
            <br />
            본 설문은 서비스 개발에 앞서 여러분의 소중한 의견을 듣고, 더 정확하고
            유용한 서비스를 만들기 위해 진행됩니다. 잠시 시간을 내어 답변해주시면
            프로젝트에 큰 도움이 될 것입니다.
            <br />
            <br />※ 본 조사를 통해 수집된 정보는 통계법 제33조 '비밀 보호의
            원칙'에 따라 통계 처리 목적으로만 사용되며, 개인 정보는 공개되지 않음을
            약속드립니다.
            <br />
            <br />
            설문에 응해주셔서 진심으로 감사합니다.
          </p>
        </header>

        <form onSubmit={handleSubmit}>
          {/* Section 1 */}
          <section className="question-group">
            <h2>1. 일반 사항</h2>

            <div className="question-item">
              <p>
                1. 귀하의 소속은 어떻게 되십니까?
                <span className="required">*</span>
              </p>
              {[
                { value: 'freshman', label: '전주대학교 신입생' },
                { value: 'student', label: '전주대학교 재학생 (2학년 이상)' },
                { value: 'graduate', label: '전주대학교 대학원생' },
                { value: 'etc', label: '기타' },
              ].map((option, idx) => (
                <label key={option.value}>
                  <input
                    type="radio"
                    name="affiliation"
                    value={option.value}
                    checked={formData.affiliation === option.value}
                    onChange={(e) => handleRadioChange('affiliation', e.target.value)}
                    required
                  />
                  {idx + 1}. {option.label}
                </label>
              ))}
            </div>

            <div className="question-item">
              <p>
                2. 'JJU Map'과 같은 전주대 주변 정보 안내 서비스가 본인에게 도움이
                될 것이라고 생각하십니까?
                <span className="required">*</span>
              </p>
              {[
                { value: '4', label: '매우 그렇다' },
                { value: '3', label: '그렇다' },
                { value: '2', label: '그렇지 않다' },
                { value: '1', label: '전혀 그렇지 않다' },
              ].map((option, idx) => (
                <label key={option.value}>
                  <input
                    type="radio"
                    name="helpfulness"
                    value={option.value}
                    checked={formData.helpfulness === option.value}
                    onChange={(e) => handleRadioChange('helpfulness', e.target.value)}
                    required
                  />
                  {idx + 1}. {option.label}
                </label>
              ))}
            </div>

            <div className="question-item">
              <p>
                3. 전주대 주변의 특정 장소를 찾을 때, 원하는 정보를 얻는 데
                어려움을 겪은 적이 있습니까?
                <span className="required">*</span>
              </p>
              {[
                { value: '4', label: '매우 자주 있다' },
                { value: '3', label: '가끔 있다' },
                { value: '2', label: '거의 없다' },
                { value: '1', label: '전혀 없다' },
              ].map((option, idx) => (
                <label key={option.value}>
                  <input
                    type="radio"
                    name="difficulty"
                    value={option.value}
                    checked={formData.difficulty === option.value}
                    onChange={(e) => handleRadioChange('difficulty', e.target.value)}
                    required
                  />
                  {idx + 1}. {option.label}
                </label>
              ))}
            </div>
          </section>

          {/* Section 2 */}
          <section className="question-group">
            <h2>2. 'JJU Map' 주요 기능에 대한 의견</h2>

            <div className="question-item">
              <p>
                4. 'JJU Map'에 다음과 같은 기능이 있다면 얼마나 유용할 것이라고
                생각하십니까?
                <span className="required">*</span>
              </p>
              <table className="likert-table">
                <thead>
                  <tr>
                    <th>기능</th>
                    <th>매우 유용</th>
                    <th>다소 유용</th>
                    <th>별로</th>
                    <th>전혀</th>
                  </tr>
                </thead>
                <tbody>
                  {likertFeatures.map((feature, idx) => (
                    <tr key={feature.name}>
                      <td>{idx + 1}) {feature.label}</td>
                      {['4', '3', '2', '1'].map((val) => (
                        <td key={val}>
                          <input
                            type="radio"
                            name={feature.name}
                            value={val}
                            checked={formData[feature.name as keyof SurveyData] === val}
                            onChange={(e) => handleRadioChange(feature.name, e.target.value)}
                            required
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="question-item">
              <p>
                5. 위 기능 외에 'JJU Map'에 추가되었으면 하는 기능이나 장소
                카테고리가 있다면 자유롭게 작성해주세요.
              </p>
              <textarea
                name="additional_features"
                placeholder="예) 복사/인쇄소, 세탁소, 학생 할인 정보 등"
                value={formData.additional_features}
                onChange={(e) => handleTextChange('additional_features', e.target.value)}
              />
            </div>
          </section>

          {/* Section 3 */}
          <section className="question-group">
            <h2>3. 전반적인 만족도 및 기타 의견</h2>

            <div className="question-item">
              <p>
                6. '전주대 주변 탐색지도(JJU Map)' 사업에 대한 전반적인 만족도를
                선택해 주세요. (향후 기대 포함)
                <span className="required">*</span>
              </p>
              {[
                { value: '4', label: '매우 만족' },
                { value: '3', label: '만족' },
                { value: '2', label: '불만족' },
                { value: '1', label: '매우 불만족' },
              ].map((option, idx) => (
                <label key={option.value}>
                  <input
                    type="radio"
                    name="overall_satisfaction"
                    value={option.value}
                    checked={formData.overall_satisfaction === option.value}
                    onChange={(e) =>
                      handleRadioChange('overall_satisfaction', e.target.value)
                    }
                    required
                  />
                  {idx + 1}. {option.label}
                </label>
              ))}
            </div>

            <div className="question-item">
              <p>
                7. 위 6번 문항에서 '불만족' 또는 '매우 불만족'을 선택한 경우, 그
                이유는 무엇인가요?
              </p>
              <textarea
                name="dissatisfaction_reason"
                placeholder="서비스의 단점이나 우려되는 점을 알려주세요."
                value={formData.dissatisfaction_reason}
                onChange={(e) =>
                  handleTextChange('dissatisfaction_reason', e.target.value)
                }
              />
            </div>

            <div className="question-item">
              <p>
                8. 마지막으로 'JJU Map' 서비스 개발팀에게 하고 싶은 말씀이나
                제안이 있다면 자유롭게 남겨주세요.
              </p>
              <textarea
                name="final_comment"
                placeholder="응원의 메시지나 추가적인 아이디어를 자유롭게 남겨주세요!"
                value={formData.final_comment}
                onChange={(e) => handleTextChange('final_comment', e.target.value)}
              />
            </div>
          </section>

          <button type="submit" className="submit-btn">
            설문 제출하기
          </button>
        </form>
      </div>

      <LandingFooter />
    </div>
  );
};

export default SurveyPage;
