import {mount} from 'enzyme';
import React from 'react';

import ComboBoxRenderer from '../ComboBoxRenderer';

const source = text => Promise.resolve([]);

describe('ComboBoxRenderer', () => {
  function editAndBlur(wrapper, text = 'foo') {
    const valueElement = wrapper.find('[tabIndex]');
    valueElement.simulate('click');

    wrapper.find('input').
      simulate('change', {target: {value: text}}).
      simulate('keydown', {key: 'Enter'});
  }

  it('opens on click', () => {
    const wrapper = mount(
      <ComboBoxRenderer
        value={null}
        source={source}
      />
    );
    wrapper.find('[tabIndex]').simulate('click');
    expect(wrapper.state().opened).toBeTruthy();
    expect(wrapper.state().isEditing).toBeTruthy();
    expect(wrapper.find('input').length).toBe(1);
  });

  it('closes if not recovered', () => {
    const onChange = jest.fn();
    const wrapper = mount(
      <ComboBoxRenderer
        value={null}
        source={source}
        onChange={onChange}
      />
    );

    editAndBlur(wrapper);

    expect(onChange.mock.calls.length).toBe(1);
    expect(onChange.mock.calls[0][1]).toBe(null);

    expect(wrapper.state().isEditing).toBeFalsy();

    const value = wrapper.find('InputLikeText');
    expect(value.text('value')).toBe('');
  });

  it('closes when value was recovered', () => {
    const onChange = jest.fn();
    const wrapper = mount(
      <ComboBoxRenderer
        value="bar"
        source={source}
        recover={x => ({value: x})}
        onChange={onChange}
      />
    );

    editAndBlur(wrapper);

    expect(onChange.mock.calls.length).toBe(1);
    expect(onChange.mock.calls[0][1]).toBe('foo');
    expect(wrapper.find('InputLikeText').length).toBe(1);
  });

  it('calls onError when value was not recovered', () => {
    const onError = jest.fn();
    const wrapper = mount(
      <ComboBoxRenderer
        value={null}
        source={source}
        recover={text => (text === 'bar') ? {value: 'bar'} : null}
        onError={onError}
      />
    );

    editAndBlur(wrapper);

    expect(onError.mock.calls.length).toBe(1);
    expect(onError.mock.calls[0][0]).toBe('not_recovered');

    editAndBlur(wrapper, 'bar');

    expect(onError.mock.calls.length).toBe(2);
    expect(onError.mock.calls[1][0]).toBe(null);
  });

  it('close menu on escape press', () => {
    const onChange = jest.fn();
    const wrapper = mount(
      <ComboBoxRenderer value="" source={source} onChange={onChange} />
    );

    wrapper.find('[tabIndex]').simulate('click');
    wrapper.find('input').
      simulate('change', {target: {value: '123'}}).
      simulate('keydown', {key: 'Escape'});

    expect(wrapper.state().opened).toBeFalsy();
    expect(onChange.mock.calls.length).toBe(0);
    expect(wrapper.find('Menu').length).toBe(0);
  });

  it('selects item by keyboard', async () => {
    const items = ['foo', 'bar'];
    const promise = Promise.resolve({values: items});
    const onChange = jest.fn();
    const wrapper = mount(
      <ComboBoxRenderer value="" source={() => promise} onChange={onChange} />
    );

    wrapper.find('[tabIndex]').simulate('click');
    await promise;
    wrapper.find('input').
      simulate('change', {target: {value: 'baz'}}).
      simulate('keydown', {key: 'ArrowDown'}).
      simulate('keydown', {key: 'Enter'});

    expect(onChange.mock.calls.length).toBe(1);
    expect(onChange.mock.calls[0][1]).toBe('foo');

    // Ensure that ComboBox is closed.
    expect(wrapper.find('InputLikeText').length).toBe(1);
  });

  it.skip('does not try to recover if closed by Enter without editing', () => {
    // TODO: do we really need this?
    const source = jest.fn(() => Promise.resolve([]));
    const onChange = jest.fn();
    const recover = jest.fn();
    const wrapper = mount(
      <ComboBoxRenderer
        value="foo"
        source={source}
        onChange={onChange}
        recover={recover}
        alkoValueToText={x => x}
      />
    );

    wrapper.find('[tabIndex]').simulate('click');
    wrapper.find('input').simulate('keydown', {key: 'Enter'});

    expect(source.mock.calls.length).toBe(1);
    expect(onChange.mock.calls.length).toBe(0);
    expect(recover.mock.calls.length).toBe(0);

    // Ensure ComboBox is closed.
    expect(wrapper.find('InputLikeText').length).toBe(1);
  });

  /* No longer supporting this */
  it.skip('tries to recover if opened by entering a char', () => {
    const source = jest.fn(() => Promise.resolve([]));
    const onChange = jest.fn();
    const recover = jest.fn();
    const wrapper = mount(
      <ComboBoxRenderer
        value="foo"
        source={source}
        onChange={onChange}
        recover={recover}
        alkoValueToText={x => x}
      />
    );

    wrapper.find('[tabIndex]').
      simulate('keypress', {charCode: 'a'.charCodeAt(0)});

    expect(source.mock.calls.length).toBe(1);
    expect(wrapper.find('input').prop('value')).toBe('a');

    wrapper.find('input').simulate('keydown', {key: 'Enter'});

    expect(recover.mock.calls.length).toBe(1);
    expect(onChange.mock.calls.length).toBe(1);
    expect(onChange.mock.calls[0][1]).toBe(null);

    // Ensure ComboBox is still open and error=true.
    expect(wrapper.find('Input').prop('error')).toBe(true);
  });

  it('calls onOpen when opening', () => {
    const items = ['foo', 'bar'];
    const promise = Promise.resolve({values: items});
    const onOpen = jest.fn();
    const wrapper = mount(
      <ComboBoxRenderer value="" source={() => promise} onOpen={onOpen} />
    );

    wrapper.find('[tabIndex]').simulate('click');
    expect(onOpen.mock.calls.length).toBe(1);

    wrapper.find('input').
      simulate('keydown', {key: 'Escape'}).
      simulate('keydown', {key: 'ArrowDown'});
    expect(onOpen.mock.calls.length).toBe(2);
  });

  it('calls onClose when closes', () => {
    const items = ['foo', 'bar'];
    const promise = Promise.resolve({values: items});
    const onClose = jest.fn();
    const wrapper = mount(
      <ComboBoxRenderer value="" source={() => promise} onClose={onClose} />
    );

    wrapper.find('[tabIndex]').simulate('click');
    expect(onClose.mock.calls.length).toBe(0);

    wrapper.find('input').
      simulate('keydown', {key: 'Escape'});
    expect(onClose.mock.calls.length).toBe(1);
  });

  it('calls onFocus when focuses', () => {
    const items = ['foo', 'bar'];
    const promise = Promise.resolve({values: items});
    const onFocus = jest.fn();
    const wrapper = mount(
      <ComboBoxRenderer value="" source={() => promise} onFocus={onFocus} />
    );

    wrapper.find('[tabIndex]').simulate('click');
    expect(onFocus.mock.calls.length).toBe(1);

    wrapper.find('input')
      .simulate('keydown', {key: 'ArrowDown'})
      .simulate('keydown', {key: 'Enter'});

    expect(onFocus.mock.calls.length).toBe(1);
  });

  it('calls onBlur when selecting an item with Enter', async () => {
    const items = ['foo', 'bar'];
    const promise = Promise.resolve({values: items});
    const onBlur = jest.fn();
    const wrapper = mount(
      <ComboBoxRenderer value="" source={() => promise} onBlur={onBlur} />
    );

    wrapper.find('[tabIndex]').simulate('click');
    await promise
    wrapper.find('input')
      .simulate('keydown', {key: 'ArrowDown'})
      .simulate('keydown', {key: 'Enter'});

    expect(onBlur.mock.calls.length).toBe(1);
  });
});
